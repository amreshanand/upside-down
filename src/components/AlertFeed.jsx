import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Info, Clock, MapPin, CheckCircle2, Users } from 'lucide-react';

function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const severityConfig = {
  high: {
    class: 'severity-high',
    icon: AlertTriangle,
    label: 'HIGH',
    dot: 'bg-red-500',
    glow: 'shadow-red-500/20',
    border: 'border-l-red-500',
  },
  medium: {
    class: 'severity-medium',
    icon: ShieldAlert,
    label: 'MEDIUM',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
    border: 'border-l-amber-500',
  },
  low: {
    class: 'severity-low',
    icon: Info,
    label: 'LOW',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-500/20',
    border: 'border-l-blue-500',
  },
};

export default function AlertFeed({ alerts, isOpen, onClose }) {
  const [filter, setFilter] = useState('all'); // 'all', 'official', 'citizen'

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'official') return alert.isOfficial;
    if (filter === 'citizen') return !alert.isOfficial;
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full bg-resq-panel/95 backdrop-blur-2xl border-l border-resq-border/50 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-resq-border/50 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-resq-text">Crisis Feed</h2>
                  <p className="text-[10px] text-resq-muted uppercase tracking-widest">
                    {filteredAlerts.length} active alert{filteredAlerts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-resq-card text-resq-muted hover:text-resq-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Impact Dashboard */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="glass-card p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter mb-1">Hazards</span>
                <span className="text-xl font-black text-resq-text">{alerts.filter(a => !a.isOfficial).length + 3}</span>
              </div>
              <div className="glass-card p-3 flex flex-col items-center justify-center text-center border-emerald-500/20">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter mb-1">Shelters</span>
                <span className="text-xl font-black text-resq-text">12</span>
              </div>
              <div className="glass-card p-3 flex flex-col items-center justify-center text-center border-blue-500/20">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1">Verified</span>
                <span className="text-xl font-black text-resq-text">154</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1 bg-resq-dark/50 rounded-lg gap-1">
              {['all', 'official', 'citizen'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    filter === t
                      ? 'bg-resq-card text-resq-text shadow-sm'
                      : 'text-resq-muted hover:text-resq-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-resq-card/60 flex items-center justify-center mb-4">
                  <ShieldAlert size={28} className="text-resq-muted/40" />
                </div>
                <p className="text-resq-muted font-medium">No {filter !== 'all' ? filter : ''} Alerts</p>
                <p className="text-resq-muted/60 text-sm mt-1">
                  Area is currently stable
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert, index) => {
                const config = severityConfig[alert.severity] || severityConfig.low;
                const Icon = config.icon;
                return (
                  <div
                    key={alert.id}
                    className={`glass-card p-4 border-l-[3px] ${config.border} animate-fade-in relative overflow-hidden`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Background glow for official */}
                    {alert.isOfficial && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 -mr-12 -mt-12 rounded-full blur-2xl" />
                    )}

                    {/* Meta info row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`${config.class} px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1`}>
                          <span className={`w-1 h-1 rounded-full ${config.dot} animate-pulse`} />
                          {config.label}
                        </span>
                        {alert.isOfficial ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            <CheckCircle2 size={10} />
                            Official
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            <Users size={10} />
                            Crowd
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-resq-muted flex items-center gap-1">
                        <Clock size={10} />
                        {getTimeAgo(alert.timestamp)}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-sm font-bold text-resq-text mb-1.5 leading-snug">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-resq-muted leading-relaxed mb-3">
                      {alert.message}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-resq-border/30">
                      <div className="flex items-center gap-1 text-[10px] text-resq-muted/80">
                        <MapPin size={10} />
                        <span className="truncate max-w-[120px]">{alert.location || 'Unknown location'}</span>
                      </div>
                      <span className="text-[10px] text-resq-muted/50 font-medium">
                        Source: {alert.source || (alert.isOfficial ? 'NDMA Authority' : 'Citizen Report')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
