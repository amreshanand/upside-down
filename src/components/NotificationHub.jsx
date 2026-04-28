import { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell } from 'lucide-react';

export default function NotificationHub({ alerts, zones = [] }) {
  const [activeNotification, setActiveNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check for high severity official alerts
    const recentHighAlert = alerts.find(a => 
      a.severity === 'high' && 
      (Date.now() - a.timestamp) < 60000
    );

    if (recentHighAlert && (!activeNotification || recentHighAlert.id !== activeNotification.id)) {
      setActiveNotification({
        id: recentHighAlert.id,
        title: recentHighAlert.title,
        message: recentHighAlert.message,
        type: 'alert'
      });
      setIsVisible(true);
    } 
    // 2. Check for new hazards reported by users
    else {
      const recentHazard = zones.find(z => 
        z.type === 'hazard' && 
        (Date.now() - z.timestamp) < 30000 // Very recent (last 30s)
      );

      if (recentHazard && (!activeNotification || recentHazard.id !== activeNotification.id)) {
        setActiveNotification({
          id: recentHazard.id,
          title: '🚨 NEW HAZARD REPORTED',
          message: recentHazard.description,
          type: 'hazard'
        });
        setIsVisible(true);
      }
    }

    if (isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [alerts, zones, activeNotification, isVisible]);

  if (!activeNotification || !isVisible) return null;

  return (
    <div className="fixed top-24 right-4 left-4 sm:left-auto sm:w-[420px] z-[2000] animate-bounce-in">
      <div className="relative overflow-hidden group">
        {/* Cinematic Glow Background */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        
        <div className={`relative glass-panel p-5 border-l-4 ${activeNotification.type === 'alert' ? 'border-red-500' : 'border-amber-500'} bg-resq-dark/95 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl ${activeNotification.type === 'alert' ? 'bg-red-500/20 ring-red-500/30' : 'bg-amber-500/20 ring-amber-500/30'} flex items-center justify-center shrink-0 animate-pulse ring-1`}>
              <AlertTriangle className={activeNotification.type === 'alert' ? 'text-red-500' : 'text-amber-500'} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-black ${activeNotification.type === 'alert' ? 'bg-red-600' : 'bg-amber-600'} text-white px-2 py-0.5 rounded-full tracking-tighter shadow-lg uppercase`}>
                  {activeNotification.type === 'alert' ? 'Emergency Alert' : 'Citizen Report'}
                </span>
                <span className="text-[10px] text-resq-muted font-bold uppercase tracking-widest opacity-60">
                  {activeNotification.type === 'alert' ? 'Official' : 'Live Update'}
                </span>
              </div>
              <h3 className="text-base font-black text-resq-text truncate tracking-tight">
                {activeNotification.title}
              </h3>
              <p className="text-sm text-resq-muted mt-1.5 leading-relaxed font-medium line-clamp-2">
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
            <div className={`flex items-center gap-2.5 text-xs ${activeNotification.type === 'alert' ? 'text-red-400' : 'text-amber-400'} font-bold`}>
              <div className={`w-2 h-2 rounded-full ${activeNotification.type === 'alert' ? 'bg-red-500' : 'bg-amber-500'} animate-ping`}></div>
              {activeNotification.type === 'alert' ? 'Immediate Action Required' : 'Verified by Community'}
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

