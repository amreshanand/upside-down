import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { X, Send, Bot, User, Loader2, Sparkles, RotateCcw } from 'lucide-react';

const SYSTEM_PROMPT = `You are ResQ AI, a disaster response assistant. Your role is to:
1. Provide step-by-step crisis guidance during natural disasters (floods, earthquakes, cyclones, etc.)
2. Help users find safety, first aid tips, and emergency procedures.
3. Detect the user's language (Hindi, Marathi, or English) and respond in the same language.
4. Be calm, clear, and concise. Lives may depend on your response.
5. If unsure, always prioritize safety and suggest calling local emergency services.
6. Keep responses short and actionable - this is an emergency context.

Important: You are NOT a general chatbot. Stay focused on disaster relief, safety, and crisis guidance only.`;

let genAI = null;
let chatSession = null;

function initializeAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') return false;

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    chatSession = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    });
    return true;
  } catch (err) {
    console.error('Gemini init error:', err);
    return false;
  }
}

export default function AIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🚨 **ResQ AI** is ready.\n\nI can help you with:\n• Emergency procedures\n• First aid guidance\n• Safety instructions\n• Evacuation tips\n\nHow can I help you stay safe?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const ready = initializeAI();
    setAiReady(ready);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
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
      if (!aiReady || !chatSession) {
        throw new Error('AI not configured');
      }

      const fullPrompt = messages.length <= 1
        ? `${SYSTEM_PROMPT}\n\nUser: ${trimmed}`
        : trimmed;

      const result = await chatSession.sendMessage(fullPrompt);
      const response = await result.response;
      const text = response.text();

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
            ? '⚠️ I encountered an issue. Please try again, or call your local emergency number for immediate help.'
            : '⚠️ **AI not configured.** Please add your Gemini API key to the `.env` file as `VITE_GEMINI_API_KEY`.\n\nIn the meantime, call your local emergency services:\n• India: **112**\n• Police: **100**\n• Ambulance: **108**',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const ready = initializeAI();
    setAiReady(ready);
    setMessages([
      {
        role: 'assistant',
        content: '🔄 Conversation reset.\n\nHow can I help you stay safe?',
        timestamp: Date.now(),
      },
    ]);
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple markdown-like rendering
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Chat Panel */}
      <div
        className={`fixed bottom-0 right-0 sm:right-4 sm:bottom-4 z-50 w-full sm:w-[400px] transition-all duration-300 ease-out ${
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full sm:translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none'
        }`}
      >
        <div className="h-[100dvh] sm:h-[560px] bg-resq-panel/95 backdrop-blur-2xl border border-resq-border/50 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-resq-border/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-resq-panel ${
                  aiReady ? 'bg-green-400' : 'bg-amber-400'
                }`} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-resq-text">ResQ AI</h2>
                <p className="text-[10px] text-resq-muted">
                  {aiReady ? 'Crisis Assistant • Online' : 'API key needed'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-resq-card text-resq-muted hover:text-resq-text transition-colors"
                title="Reset conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-resq-card text-resq-muted hover:text-resq-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 animate-fade-in ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-violet-500/20 to-purple-600/20'
                    : 'bg-resq-accent/15'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Bot size={14} className="text-purple-400" />
                  ) : (
                    <User size={14} className="text-blue-400" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] ${
                  msg.role === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-resq-accent text-white rounded-br-md'
                      : 'bg-resq-card/80 text-resq-text border border-resq-border/20 rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                  </div>
                  <p className="text-[10px] text-resq-muted/40 mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                  <Bot size={14} className="text-purple-400" />
                </div>
                <div className="bg-resq-card/80 border border-resq-border/20 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-resq-muted/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-resq-muted/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-resq-muted/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-resq-border/50 shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for emergency help..."
                className="flex-1 px-4 py-2.5 bg-resq-dark/60 border border-resq-border/30 rounded-xl text-sm text-resq-text placeholder-resq-muted/40 focus:outline-none focus:border-resq-accent/40 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-resq-accent hover:bg-blue-600 text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
            <p className="text-[10px] text-resq-muted/30 text-center mt-2">
              For life-threatening emergencies, call <strong className="text-resq-muted/50">112</strong>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
