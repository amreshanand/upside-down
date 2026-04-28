import { Shield, Bell, MessageCircle, Radio } from 'lucide-react';

export default function Navbar({ alertCount, onToggleAlerts, onToggleChat, showAlerts, showChat }) {
  return (
    <nav className="absolute top-0 left-0 right-0 z-30 px-4 py-3">
      <div className="glass-panel px-4 py-2.5 flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield size={18} className="text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-resq-panel animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-gradient">ResQ</span>
            </h1>
            <p className="text-[10px] text-resq-muted -mt-0.5 tracking-widest uppercase">Disaster Response</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Radio size={12} className="text-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">LIVE</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* SOS Button */}
          <button
            onClick={() => window.open('tel:112')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/30"
          >
            <Shield size={14} className="animate-pulse" />
            SOS
          </button>

          <div className="w-[1px] h-8 bg-resq-border/30 mx-1 hidden sm:block" />
          {/* Alerts toggle */}
          <button
            onClick={onToggleAlerts}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${
              showAlerts
                ? 'bg-resq-accent/20 text-resq-accent'
                : 'hover:bg-resq-card text-resq-muted hover:text-resq-text'
            }`}
            title="View alerts"
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-bounce-in">
                {alertCount}
              </span>
            )}
          </button>

          {/* Chat toggle */}
          <button
            onClick={onToggleChat}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              showChat
                ? 'bg-resq-accent/20 text-resq-accent'
                : 'hover:bg-resq-card text-resq-muted hover:text-resq-text'
            }`}
            title="AI Assistant"
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
