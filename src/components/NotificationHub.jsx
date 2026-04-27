import { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell } from 'lucide-react';

export default function NotificationHub({ alerts }) {
  const [activeNotification, setActiveNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Look for high severity alerts that are "new" (within the last minute)
    const recentHighAlert = alerts.find(a => 
      a.severity === 'high' && 
      (Date.now() - a.timestamp) < 60000
    );

    if (recentHighAlert && (!activeNotification || recentHighAlert.id !== activeNotification.id)) {
      setActiveNotification(recentHighAlert);
      setIsVisible(true);
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [alerts, activeNotification]);

  if (!activeNotification || !isVisible) return null;

  return (
    <div className="fixed top-24 right-4 left-4 sm:left-auto sm:w-[420px] z-[2000] animate-bounce-in">
      <div className="relative overflow-hidden group">
        {/* Cinematic Glow Background */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        
        <div className="relative glass-panel p-5 border-l-4 border-red-500 bg-resq-dark/95 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0 animate-pulse ring-1 ring-red-500/30">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full tracking-tighter shadow-lg shadow-red-500/20 uppercase">
                  Emergency Alert
                </span>
                <span className="text-[10px] text-resq-muted font-bold uppercase tracking-widest opacity-60">
                  Real-time
                </span>
              </div>
              <h3 className="text-base font-black text-resq-text truncate tracking-tight">
                {activeNotification.title}
              </h3>
              <p className="text-sm text-resq-muted mt-1.5 leading-relaxed font-medium">
                {activeNotification.message}
              </p>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1.5 hover:bg-resq-card rounded-xl transition-all text-resq-muted hover:text-resq-text"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-resq-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-red-400 font-bold">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
              Immediate Action Required
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="px-4 py-1.5 rounded-lg bg-resq-card hover:bg-resq-border/20 text-[11px] font-black text-resq-text uppercase tracking-widest transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

