import { X, AlertTriangle, ShieldAlert, Info, Clock, MapPin } from 'lucide-react';

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
          <div className="px-5 py-4 border-b border-resq-border/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-resq-text">Live Alerts</h2>
                <p className="text-[10px] text-resq-muted uppercase tracking-widest">
                  {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
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

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-resq-card/60 flex items-center justify-center mb-4">
                  <ShieldAlert size={28} className="text-resq-muted/40" />
                </div>
                <p className="text-resq-muted font-medium">No Active Alerts</p>
                <p className="text-resq-muted/60 text-sm mt-1">
                  All clear in your area
                </p>
              </div>
            ) : (
              alerts.map((alert, index) => {
                const config = severityConfig[alert.severity] || severityConfig.low;
                const Icon = config.icon;
                return (
                  <div
                    key={alert.id}
                    className={`glass-card p-4 border-l-[3px] ${config.border} animate-fade-in`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Severity badge + time */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`${config.class} px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
                        {config.label}
                      </span>
                      <span className="text-[10px] text-resq-muted flex items-center gap-1">
                        <Clock size={10} />
                        {getTimeAgo(alert.timestamp)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-resq-text mb-1.5 leading-snug">
                      {alert.title}
                    </h3>

                    {/* Message */}
                    <p className="text-xs text-resq-muted leading-relaxed mb-2.5">
                      {alert.message}
                    </p>

                    {/* Location */}
                    {alert.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-resq-muted/70">
                        <MapPin size={11} />
                        <span>{alert.location}</span>
                      </div>
                    )}
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
