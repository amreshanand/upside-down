import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, RotateCcw, ShieldAlert, Languages } from 'lucide-react';

const SYSTEM_PROMPT = `You are ResQ AI, a hyperlocal disaster response assistant for India. Your role is:
1. Provide ACTIONABLE, step-by-step crisis guidance (Floods, Earthquakes, Fires).
2. Help users find safety based on the real-time context provided.
3. Respond in the user's language (Hindi, Marathi, English, etc.).
4. Use a calm, professional, and authoritative tone.
5. If medical advice is needed, give standard first-aid steps but prioritize getting professional help.
6. STAY FOCUSED on the current crisis. Do not discuss unrelated topics.

CRITICAL: You will be provided with CURRENT SYSTEM DATA (Nearby Hazards and Official Alerts). Use this data to give specific, hyperlocal advice. If a road is blocked near the user, tell them to avoid it. If a safe zone is nearby, mention it.`;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getGroqApiKey() {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || key === 'your_groq_api_key_here') return null;
  return key;
}

const QUICK_SUGGESTIONS = [
  { id: 'shelter', label: 'Find Nearest Shelter', icon: '🏠', prompt: 'Where is the nearest verified safe shelter near my location?' },
  { id: 'firstaid', label: 'First Aid Guide', icon: '🩹', prompt: 'Give me a quick first aid guide for flood-related injuries.' },
  { id: 'evac', label: 'Evacuation Steps', icon: '🏃', prompt: 'What are the top 5 steps for immediate evacuation in a flood?' },
  { id: 'water', label: 'Safe Water Tips', icon: '💧', prompt: 'How can I ensure water is safe to drink during this disaster?' },
];

export default function AIChat({ isOpen, onClose, zones = [], alerts = [] }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🚨 **ResQ AI** is online.\n\nI am aware of current local hazards and official alerts. Use the suggestions below or ask me anything for immediate safety guidance.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  // Conversation history for Groq (OpenAI format)
  const conversationHistory = useRef([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const key = getGroqApiKey();
    setAiReady(!!key);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const generateContextString = () => {
    const activeZones = zones.slice(0, 5).map(z => `- ${z.type.toUpperCase()}: ${z.description} (Confirmed by ${z.confirmations?.length || 0} users)`).join('\n');
    const activeAlerts = alerts.filter(a => a.severity === 'high').map(a => `- OFFICIAL ALERT: ${a.title} - ${a.message}`).join('\n');
    
    return `
--- CURRENT SYSTEM DATA ---
NEARBY HAZARDS:
${activeZones || 'No hazards reported in the immediate vicinity.'}

OFFICIAL ALERTS:
${activeAlerts || 'No high-severity official alerts at this time.'}
---------------------------
`;
  };

  const callGroqAPI = async (userMessage) => {
    const apiKey = getGroqApiKey();
    if (!apiKey) throw new Error('Groq API key not configured');

    const contextHeader = generateContextString();

    // Build system message with context
    const systemMessage = {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n${contextHeader}`,
    };

    // Add user message to history
    conversationHistory.current.push({
      role: 'user',
      content: userMessage,
    });

    // Build full messages array: system + conversation history
    const apiMessages = [systemMessage, ...conversationHistory.current];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: apiMessages,
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'No response received.';

    // Add assistant response to history
    conversationHistory.current.push({
      role: 'assistant',
      content: assistantMessage,
    });

    return assistantMessage;
  };

  const handleSend = async (textToSend) => {
    const trimmed = typeof textToSend === 'string' ? textToSend.trim() : input.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (!aiReady) {
        throw new Error('AI not configured');
      }

      const text = await callGroqAPI(trimmed);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error('AI response error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiReady
            ? `⚠️ I encountered an issue: ${error.message}. Please try again, or call your local emergency number for immediate help.`
            : '⚠️ **AI not configured.** Please add your Groq API key to the `.env` file as `VITE_GROQ_API_KEY`.\n\nIn the meantime, call emergency services: **112**',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    conversationHistory.current = [];
    const key = getGroqApiKey();
    setAiReady(!!key);
    setMessages([
      {
        role: 'assistant',
        content: '🔄 Conversation reset. I am refreshed with current crisis data.\n\nHow can I help?',
        timestamp: Date.now(),
      },
    ]);
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (rendered.startsWith('• ') || rendered.startsWith('- ')) {
        rendered = `<span class="text-resq-accent">›</span> ${rendered.slice(2)}`;
      }
      return (
        <span key={i} className="block" dangerouslySetInnerHTML={{ __html: rendered || '&nbsp;' }} />
      );
    });
  };

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1500] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Chat Panel */}
      <div
        className={`fixed bottom-0 right-0 sm:right-4 sm:bottom-4 z-[1600] w-full sm:w-[440px] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
          isOpen
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-full sm:translate-y-[calc(100%+2rem)] opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="h-[100dvh] sm:h-[620px] bg-resq-panel/95 backdrop-blur-3xl border border-resq-border/40 sm:rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ring-1 ring-white/5">
          {/* Header */}
          <div className="px-5 py-4 border-b border-resq-border/20 flex items-center justify-between shrink-0 bg-gradient-to-r from-resq-panel to-resq-dark/40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 animate-pulse">
                  <Bot size={20} className="text-white" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-resq-panel ${
                  aiReady ? 'bg-green-400' : 'bg-amber-400'
                } shadow-sm`} />
              </div>
              <div>
                <h2 className="text-sm font-black text-resq-text tracking-tight uppercase">ResQ AI Expert</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-green-400 font-black tracking-tighter">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    SYSTEM ONLINE
                  </div>
                  <div className="px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[9px] text-orange-400 font-black uppercase tracking-widest">
                    Groq ⚡
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
                className="p-2 rounded-xl hover:bg-resq-card text-resq-muted hover:text-resq-text transition-all active:scale-90"
                title="Clear Memory"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-resq-card text-resq-muted hover:text-resq-text transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scroll-smooth">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3.5 animate-fade-in ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-purple-500/20'
                    : 'bg-resq-accent/10 border border-resq-accent/20'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Bot size={16} className="text-purple-400" />
                  ) : (
                    <User size={16} className="text-blue-400" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[88%] ${
                  msg.role === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
                    msg.role === 'user'
                      ? 'bg-resq-accent text-white rounded-br-sm glow-blue font-medium'
                      : 'bg-resq-card/90 text-resq-text border border-resq-border/20 rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                  </div>
                  <p className="text-[10px] text-resq-muted/50 mt-1.5 px-1 font-bold tracking-widest uppercase">
                    {msg.role === 'assistant' ? 'ResQ AI' : 'Citizen'} • {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3.5 animate-fade-in">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                  <Bot size={16} className="text-purple-400" />
                </div>
                <div className="bg-resq-card/90 border border-resq-border/20 px-5 py-3.5 rounded-2xl rounded-bl-sm flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-black text-purple-400/60 uppercase tracking-widest">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Suggestions */}
          <div className="px-5 py-4 border-t border-resq-border/20 shrink-0 bg-resq-dark/20 backdrop-blur-sm">
            {/* Suggestion Chips */}
            {!loading && messages.length < 3 && (
              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSend(s.prompt)}
                    className="whitespace-nowrap px-3.5 py-2 rounded-xl bg-resq-card/50 border border-resq-border/30 text-xs font-bold text-resq-text hover:bg-resq-accent hover:border-resq-accent hover:text-white transition-all flex items-center gap-2 group active:scale-95"
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2.5">
              <div className="flex-1 relative group">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your emergency..."
                  className="w-full pl-4 pr-12 py-3 bg-resq-dark/60 border border-resq-border/30 rounded-2xl text-sm text-resq-text placeholder-resq-muted/50 focus:outline-none focus:border-resq-accent/50 focus:ring-4 focus:ring-resq-accent/10 transition-all"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black text-resq-muted bg-resq-dark px-1.5 py-0.5 rounded-md border border-resq-border/20 uppercase">
                    Enter ↵
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3.5 rounded-2xl bg-resq-accent hover:bg-blue-600 text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 shadow-lg shadow-blue-500/20 flex items-center justify-center"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                <p className="text-[10px] text-resq-muted font-black uppercase tracking-widest">
                  Powered by Groq ⚡ Llama 3.3
                </p>
              </div>
              <p className="text-[9px] text-resq-muted/40 font-bold uppercase tracking-tighter">
                Secure 256-bit Guidance
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
