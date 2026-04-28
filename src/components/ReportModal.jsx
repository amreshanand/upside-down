import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, AlertTriangle, MapPin, Send, Loader2, CheckCircle, ShieldAlert, Info, Search } from 'lucide-react';

const hazardCategories = [
  { 
    id: 'water', label: 'Water', emoji: '🌊', 
    types: ['Flood', 'Tsunami', 'Flash Flood', 'Storm Surge', 'Coastal Erosion'] 
  },
  { 
    id: 'geological', label: 'Geological', emoji: '🌍', 
    types: ['Earthquake', 'Volcanic Eruption', 'Landslide', 'Avalanche', 'Sinkhole'] 
  },
  { 
    id: 'weather', label: 'Weather', emoji: '🌪️', 
    types: ['Cyclone/Hurricane', 'Tornado', 'Drought', 'Heatwave', 'Blizzard', 'Thunderstorm', 'Hailstorm'] 
  },
  { 
    id: 'fire', label: 'Fire', emoji: '🔥', 
    types: ['Wildfire', 'Urban Fire', 'Industrial Fire'] 
  },
  { 
    id: 'manmade', label: 'Man-Made', emoji: '🧪', 
    types: ['Chemical Spill', 'Nuclear Accident', 'Oil Spill', 'Explosion', 'Dam Failure', 'Bridge Collapse'] 
  },
  { 
    id: 'biological', label: 'Biological', emoji: '🦠', 
    types: ['Epidemic', 'Pandemic', 'Locust Swarm'] 
  },
  { 
    id: 'environmental', label: 'Environmental', emoji: '☢️', 
    types: ['Air Pollution', 'Soil Erosion', 'Deforestation'] 
  },
  { 
    id: 'security', label: 'Security', emoji: '💣', 
    types: ['Terrorist Attack', 'Civil Unrest', 'Armed Conflict'] 
  },
  { 
    id: 'transport', label: 'Transport', emoji: '🚗', 
    types: ['Road Accident', 'Train Derailment', 'Plane Crash', 'Boat Sinking'] 
  },
];

const severityLevels = [
  { value: 'low', label: 'Low', icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { value: 'medium', label: 'Medium', icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { value: 'high', label: 'High', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
];

export default function ReportModal({ isOpen, onClose, coords, userId }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hazardType, setHazardType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch live location suggestions from real-time places API (Photon/OSM)
  useEffect(() => {
    if (locationName.length < 2 || !isOpen) {
      if (locationName.length === 0 && isOpen) {
        setSuggestions(['Popular: Shaniwar Wada', 'Popular: Pune Station', 'Popular: Phoenix Marketcity', 'Popular: FC Road']);
      } else {
        setSuggestions([]);
      }
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(locationName)}&lat=18.5204&lon=73.8567&limit=10`
        );
        const data = await response.json();
        
        const formatted = data.features.map(f => {
          const p = f.properties;
          const name = p.name || '';
          const city = p.city ? `, ${p.city}` : '';
          const district = p.district ? ` (${p.district})` : '';
          return `${name}${district}${city}`;
        }).filter(name => name.length > 0);

        setSuggestions([...new Set(formatted)]);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Places Search error:', err);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [locationName, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hazardType || !locationName.trim() || !coords) return;

    setSubmitting(true);
    const reportDesc = `[${selectedCategory?.label || ''}] ${hazardType}${locationName ? ' @ ' + locationName : ''}${description ? ': ' + description : ''}`;
    
    try {
      // 1. Save to Zones (for map markers)
      await addDoc(collection(db, 'zones'), {
        type: 'hazard',
        hazardType: selectedCategory?.id || 'all',
        lat: coords.lat,
        lng: coords.lng,
        description: reportDesc,
        severity: severity,
        timestamp: Date.now(),
        reportedBy: userId || 'anonymous',
        confirmations: [userId || 'anonymous'],
      });

      // 2. Save to Alerts (for Crisis Feed)
      await addDoc(collection(db, 'alerts'), {
        title: `USER REPORT: ${hazardType}`,
        message: reportDesc,
        severity: severity,
        timestamp: Date.now(),
        isOfficial: false,
        source: 'Citizen Report',
        location: locationName,
        lat: coords.lat,
        lng: coords.lng
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        resetForm();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Report submission failed:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setHazardType('');
    setSeverity('medium');
    setDescription('');
    setLocationName('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
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
          className="glass-panel p-6 w-full max-w-lg pointer-events-auto animate-bounce-in max-h-[90dvh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success State */}
          {submitted ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-resq-text mb-1">Report Submitted!</h3>
              <p className="text-sm text-resq-muted">Thank you for helping keep others safe. Your report is now live in the Crisis Feed.</p>
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
                    <p className="text-xs text-resq-muted">Select category and issue type</p>
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
                {/* Location Name Input with Suggestions */}
                <div className="relative">
                  <label className="block text-[10px] text-resq-muted font-black uppercase tracking-widest mb-1.5 px-1 flex justify-between">
                    <span>Location Name / Landmark</span>
                    <span className="text-red-500 text-[9px]">* REQUIRED</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="e.g. Near Shaniwar Wada"
                      className="input-field py-2 text-sm pl-9"
                      required
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-resq-muted" size={14} />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 glass-panel border border-resq-border/40 overflow-hidden shadow-2xl">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setLocationName(s);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-resq-text hover:bg-resq-accent/20 transition-colors border-b border-resq-border/10 last:border-0"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 1: Category Selection */}
                <div>
                  <label className="block text-[10px] text-resq-muted font-black uppercase tracking-widest mb-2 px-1">
                    1. Select Category
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {hazardCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setHazardType('');
                        }}
                        className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all shrink-0 min-w-[80px] ${
                          selectedCategory?.id === cat.id
                            ? 'border-resq-accent bg-resq-accent/10 shadow-lg shadow-blue-500/10'
                            : 'border-resq-border/30 bg-resq-dark/30 hover:border-resq-border/60'
                        }`}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${
                          selectedCategory?.id === cat.id ? 'text-resq-text' : 'text-resq-muted'
                        }`}>
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Hazard Type Selection (Conditional) */}
                {selectedCategory && (
                  <div className="animate-slide-down">
                    <label className="block text-[10px] text-resq-muted font-black uppercase tracking-widest mb-2 px-1">
                      2. Select Hazard Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCategory.types.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setHazardType(type)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            hazardType === type
                              ? 'border-resq-accent bg-resq-accent/20 text-resq-text shadow-sm'
                              : 'border-resq-border/20 bg-resq-dark/40 text-resq-muted hover:border-resq-border/40'
                          }`}
                        >
                          <span className="text-xs font-medium">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Severity Selection */}
                <div>
                  <label className="block text-xs font-semibold text-resq-muted uppercase tracking-wider mb-2">
                    Severity Level
                  </label>
                  <div className="flex gap-2">
                    {severityLevels.map((lvl) => {
                      const Icon = lvl.icon;
                      return (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => setSeverity(lvl.value)}
                          className={`flex-1 py-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                            severity === lvl.value
                              ? `border-resq-accent bg-resq-accent/10`
                              : 'border-resq-border/30 bg-resq-dark/30'
                          }`}
                        >
                          <Icon size={14} className={severity === lvl.value ? lvl.color : 'text-resq-muted'} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            severity === lvl.value ? 'text-resq-text' : 'text-resq-muted'
                          }`}>
                            {lvl.label}
                          </span>
                        </button>
                      );
                    })}
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
                  disabled={!hazardType || !locationName.trim() || submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-blue-500/10"
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

