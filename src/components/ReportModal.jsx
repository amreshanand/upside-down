import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, AlertTriangle, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';

const hazardTypes = [
  { value: 'Flooded Road', emoji: '🌊', color: 'text-blue-400' },
  { value: 'Blocked Road', emoji: '🚧', color: 'text-amber-400' },
  { value: 'Open Shelter', emoji: '🏠', color: 'text-green-400' },
  { value: 'Medical Need', emoji: '🏥', color: 'text-red-400' },
];

export default function ReportModal({ isOpen, onClose, coords, userId }) {
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hazardType || !coords) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'zones'), {
        type: 'hazard',
        lat: coords.lat,
        lng: coords.lng,
        description: `${hazardType}${description ? ': ' + description : ''}`,
        timestamp: Date.now(),
        reportedBy: userId || 'anonymous',
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setHazardType('');
        setDescription('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Report submission failed:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setHazardType('');
      setDescription('');
      setSubmitted(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="glass-panel p-6 w-full max-w-md pointer-events-auto animate-bounce-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success State */}
          {submitted ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-resq-text mb-1">Report Submitted!</h3>
              <p className="text-sm text-resq-muted">Thank you for helping keep others safe.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-resq-text">Report Hazard</h2>
                    <p className="text-xs text-resq-muted">Help others by reporting dangers</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-resq-card text-resq-muted hover:text-resq-text transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Location info */}
              {coords && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-resq-dark/40 border border-resq-border/30 mb-4">
                  <MapPin size={14} className="text-resq-accent shrink-0" />
                  <span className="text-xs text-resq-muted truncate">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hazard type selection */}
                <div>
                  <label className="block text-xs font-semibold text-resq-muted uppercase tracking-wider mb-2">
                    Hazard Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {hazardTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setHazardType(type.value)}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                          hazardType === type.value
                            ? 'border-resq-accent bg-resq-accent/10 shadow-lg shadow-blue-500/10'
                            : 'border-resq-border/30 bg-resq-dark/30 hover:border-resq-border/60 hover:bg-resq-card/50'
                        }`}
                      >
                        <span className="text-lg mb-1 block">{type.emoji}</span>
                        <span className={`text-xs font-medium ${
                          hazardType === type.value ? 'text-resq-text' : 'text-resq-muted'
                        }`}>
                          {type.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-resq-muted uppercase tracking-wider mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details..."
                    className="input-field resize-none h-20"
                    maxLength={200}
                  />
                  <p className="text-[10px] text-resq-muted/50 mt-1 text-right">
                    {description.length}/200
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!hazardType || submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Report
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
