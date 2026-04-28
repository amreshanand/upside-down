import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Map from '../components/Map';
import AlertFeed from '../components/AlertFeed';
import ReportModal from '../components/ReportModal';
import AIChat from '../components/AIChat';
import NotificationHub from '../components/NotificationHub';
import { AlertTriangle, Navigation, LocateFixed, Loader2, CheckCircle2 } from 'lucide-react';

export default function Home({ user }) {
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportCoords, setReportCoords] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 18.5204, lng: 73.8567 });
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('fetching'); // 'fetching' | 'success' | 'error'
  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const watchIdRef = useRef(null);

  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 19.076, lng: 72.8777 });
      setLocationStatus('error');
      setLocationError('Geolocation not supported. Using default location (Pune).');
      return;
    }

    // Clear any existing watcher
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setLocationStatus('fetching');
    setLocationError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newLoc);
        // Only auto-center map if no detected location is active
        if (!detectedLocation) {
          setMapCenter(newLoc);
        }
        setLocationStatus('success');
        setLocationError(null);
        setShowLocationBanner(true);
        // Auto-hide success banner after 3s
        setTimeout(() => setShowLocationBanner(false), 3000);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setShowLocationBanner(true);
        const msg =
          error.code === 1
            ? 'Browser location blocked. Click the 🔒 lock icon in the address bar → Site settings → Location → Allow, then retry.'
            : error.code === 2
            ? 'GPS signal unavailable. Using default location (Pune).'
            : 'Location request timed out. Using default location (Pune).';
        setLocationError(msg);
        setLocationStatus('error');
        if (!userLocation) {
          setUserLocation({ lat: 18.5204, lng: 73.8567 });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, [userLocation]);

  // Start watching location on mount
  useEffect(() => {
    startLocationWatch();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Real-time zones listener
  useEffect(() => {
    const q = query(collection(db, 'zones'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // ── PUNE SAFE ZONES: Hospitals, Police HQs, Colleges ───────────────
      const puneStaticZones = [
        // === HOSPITALS (Safe for All) ===
        { id: 'safe-sassoon',      type: 'safe', hazardType: 'all', lat: 18.5196, lng: 73.8553, description: '🏥 SAFE ZONE: Sassoon General Hospital — Government hospital, 24/7 emergency, trauma centre.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-kem',          type: 'safe', hazardType: 'all', lat: 18.5270, lng: 73.8628, description: '🏥 SAFE ZONE: KEM Hospital Pune — Large public hospital, emergency ward active.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-ruby',         type: 'safe', hazardType: 'all', lat: 18.5287, lng: 73.8773, description: '🏥 SAFE ZONE: Ruby Hall Clinic — Multi-specialty private hospital, 24/7 ICU.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-jehangir',     type: 'safe', hazardType: 'all', lat: 18.5318, lng: 73.8743, description: '🏥 SAFE ZONE: Jehangir Hospital — Tertiary care hospital, emergency services.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-deenanath',    type: 'safe', hazardType: 'all', lat: 18.4931, lng: 73.8076, description: '🏥 SAFE ZONE: Deenanath Mangeshkar Hospital — 900-bed hospital, trauma & critical care.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-bharati',      type: 'safe', hazardType: 'all', lat: 18.4647, lng: 73.8633, description: '🏥 SAFE ZONE: Bharati Vidyapeeth Hospital & Research Centre — Medical college hospital.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-afmc',         type: 'safe', hazardType: 'all', lat: 18.5427, lng: 73.8780, description: '🏥 SAFE ZONE: AFMC Military Hospital — Armed Forces Medical College, secured campus.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-poona-hosp',   type: 'safe', hazardType: 'all', lat: 18.5135, lng: 73.8626, description: '🏥 SAFE ZONE: Poona Hospital & Research Centre — Emergency & surgical care, 24/7.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-aundh-hosp',   type: 'safe', hazardType: 'all', lat: 18.5598, lng: 73.8120, description: '🏥 SAFE ZONE: Aundh District Hospital — Government district hospital, emergency ward.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-noble',        type: 'safe', hazardType: 'all', lat: 18.5467, lng: 73.9210, description: '🏥 SAFE ZONE: Noble Hospital, Hadapsar — Multi-specialty, 24/7 emergency.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },

        // === POLICE HEADQUARTERS ===
        { id: 'safe-police-comm',  type: 'safe', hazardType: 'all', lat: 18.5204, lng: 73.8567, description: '🚔 SAFE ZONE: Pune Police Commissioner HQ — Central police headquarters, armed deployment.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-police-rural', type: 'safe', hazardType: 'all', lat: 18.5073, lng: 73.8022, description: '🚔 SAFE ZONE: Pune Rural Superintendent of Police Office — SP Office, emergency response.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-police-pim',   type: 'safe', hazardType: 'all', lat: 18.6071, lng: 73.8178, description: '🚔 SAFE ZONE: Pimpri-Chinchwad Police HQ (PCMC) — Twin city police command centre.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },

        // === SCHOOLS & COLLEGES (Flood Safe - High Structures) ===
        { id: 'safe-fergusson',    type: 'safe', hazardType: 'flood', lat: 18.5203, lng: 73.8407, description: '🏫 FLOOD SAFE: Fergusson College — Designated high-ground civic shelter.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-sppu',         type: 'safe', hazardType: 'all', lat: 18.5576, lng: 73.8169, description: '🏫 SAFE ZONE: SPPU — Large open campus (Earthquake Safe) & High structures (Flood Safe).', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-coep',         type: 'safe', hazardType: 'flood', lat: 18.5301, lng: 73.8511, description: '🏫 FLOOD SAFE: COEP — Sturdy multi-story structures for flood assembly.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-mit',          type: 'safe', hazardType: 'earthquake', lat: 18.4574, lng: 73.8421, description: '🏫 EARTHQUAKE SAFE: MIT Kothrud — Large open playground area for safe assembly.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },
        { id: 'safe-wadia',        type: 'safe', hazardType: 'flood', lat: 18.5267, lng: 73.8648, description: '🏫 FLOOD SAFE: Wadia College — Registered flood shelter with high-floor access.', timestamp: Date.now() - 86400000, confirmations: ['s1','s2','s3'] },

        // ── PUNE DANGER ZONES ───────────────
        { id: 'danger-mutha-khadak',   type: 'danger', hazardType: 'flood', lat: 18.4527, lng: 73.7711, description: '🚨 FLOOD DANGER: Mutha River near Dam — Extreme water levels during discharge.', timestamp: Date.now() - 1800000, confirmations: ['d1','d2','d3','d4'] },
        { id: 'danger-sangam',         type: 'danger', hazardType: 'flood', lat: 18.5133, lng: 73.8357, description: '🚨 FLOOD DANGER: Mula-Mutha Sangam — River banks breach here first.', timestamp: Date.now() - 900000, confirmations: ['d1','d2','d3','d4','d5'] },
        { id: 'danger-vishrantwadi',   type: 'danger', hazardType: 'flood', lat: 18.5893, lng: 73.9046, description: '🚨 FLOOD DANGER: Low-lying pocket — Chronic waterlogging zone.', timestamp: Date.now() - 2700000, confirmations: ['d1','d2','d3'] },
        { id: 'danger-katraj-ghat',    type: 'danger', hazardType: 'earthquake', lat: 18.4327, lng: 73.8643, description: '🚨 EARTHQUAKE DANGER: Katraj Ghat — High risk of rockfall/landslides during seismic activity.', timestamp: Date.now() - 3000000, confirmations: ['d1','d2','d3'] },
        { id: 'danger-narrow-peth',    type: 'danger', hazardType: 'earthquake', lat: 18.5162, lng: 73.8544, description: '🚨 EARTHQUAKE DANGER: Narrow Peth Alleys — High density old structures, risk of collapse.', timestamp: Date.now() - 1000000, confirmations: ['d1'] },
      ];

      // Filter out any real Firestore data further than 50km (keep all Pune data)
      const filterByDistance = (lat, lng) => {
        const R = 6371;
        const refLat = 18.5204; // Pune city center
        const refLng = 73.8567;
        const dLat = (lat - refLat) * Math.PI / 180;
        const dLon = (lng - refLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(refLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c) <= 50;
      };

      const zoneData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(z => filterByDistance(z.lat, z.lng));

      setZones([...puneStaticZones, ...zoneData]);

    }, (error) => {
      console.error('Zones listener error:', error);
    });

    return () => unsubscribe();
  }, [userLocation]);

  // Real-time alerts listener
  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dummyAlerts = [
        { 
          id: 'a1', 
          title: 'LOCAL AUTHORITY: Heavy Rainfall', 
          message: 'Intense rainfall detected in your immediate vicinity. Stay indoors and avoid low-lying areas.', 
          severity: 'high', 
          timestamp: Date.now() - 900000,
          isOfficial: true,
          source: 'Disaster MGMT',
          location: 'Your Current Area'
        },
        { 
          id: 'a2', 
          title: 'HYPERLOCAL: Road Blockage', 
          message: 'A hazard has been verified by 3+ neighbors nearby. Traffic is being diverted.', 
          severity: 'medium', 
          timestamp: Date.now() - 3600000,
          isOfficial: false,
          source: 'Verified Report',
          location: '1.2km Away'
        }
      ];
      const alertData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlerts([...dummyAlerts, ...alertData]);
    }, (error) => {
      console.error('Alerts listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Handle map click for reporting
  const handleMapClick = useCallback((coords) => {
    setReportCoords(coords);
    setShowReport(true);
  }, []);

  // Take me to safety
  const handleTakeToSafety = useCallback(() => {
    if (!userLocation) return;

    const safeZones = zones.filter((z) => z.type === 'safe');
    if (safeZones.length === 0) {
      alert('No safe zones available at this time.');
      return;
    }

    // Find nearest safe zone
    let nearest = safeZones[0];
    let minDist = Infinity;

    safeZones.forEach((zone) => {
      const dist = Math.sqrt(
        Math.pow(zone.lat - userLocation.lat, 2) +
        Math.pow(zone.lng - userLocation.lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = zone;
      }
    });

    // Open Google Maps directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}`;
    window.open(url, '_blank');
  }, [userLocation, zones]);

  const highAlertCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-resq-dark">
      {/* Navbar */}
      <Navbar
        alertCount={highAlertCount}
        onToggleAlerts={() => { setShowAlerts(!showAlerts); setShowChat(false); }}
        onToggleChat={() => { setShowChat(!showChat); setShowAlerts(false); }}
        showAlerts={showAlerts}
        showChat={showChat}
      />

      {/* Location Status Banner */}
      {showLocationBanner && locationStatus === 'fetching' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-slide-down">
          <div className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-resq-accent">
            <Loader2 size={14} className="animate-spin" />
            Acquiring your GPS location...
          </div>
        </div>
      )}

      {showLocationBanner && locationStatus === 'success' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-slide-down">
          <div className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 size={14} />
            Live location active
          </div>
        </div>
      )}

      {showLocationBanner && locationStatus === 'error' && locationError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-slide-down w-[90vw] max-w-lg">
          <div className="glass-card px-4 py-2 flex items-start gap-2 text-sm text-amber-400">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span className="flex-1 text-xs leading-snug">{locationError}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={startLocationWatch}
                className="px-2 py-0.5 rounded-md bg-resq-accent/20 border border-resq-accent/30 text-resq-accent text-xs font-bold hover:bg-resq-accent/30 transition-all"
              >
                Retry
              </button>
              <button
                onClick={() => setShowLocationBanner(false)}
                className="px-2 py-0.5 rounded-md bg-resq-card text-resq-muted text-xs font-bold hover:text-resq-text transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <Map
        zones={zones}
        userLocation={userLocation}
        mapCenter={mapCenter}
        detectedLocation={detectedLocation}
        onMapClick={handleMapClick}
        userId={user?.uid}
      />

      {/* Notification Hub (Toasts) */}
      <NotificationHub alerts={alerts} zones={zones} />

      {/* Alert Feed Panel */}
      <AlertFeed
        alerts={alerts}
        isOpen={showAlerts}
        onClose={() => setShowAlerts(false)}
      />

      {/* AI Chat Panel */}
      <AIChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        zones={zones}
        alerts={alerts}
        onLocationDetected={(loc) => {
          setMapCenter(loc);
          setDetectedLocation(loc);
          // Auto-clear detected marker after 15 seconds
          setTimeout(() => setDetectedLocation(null), 15000);
        }}
      />

      {/* Report Hazard Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => { setShowReport(false); setReportCoords(null); }}
        coords={reportCoords}
        userId={user?.uid}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
        {/* Take Me to Safety */}
        <button
          onClick={handleTakeToSafety}
          className="floating-btn bg-gradient-to-r from-emerald-500 to-green-600 text-white glow-green"
          title="Navigate to nearest safe zone"
        >
          <Navigation size={20} className="animate-pulse-slow" />
          <span className="hidden sm:inline">Take Me to Safety</span>
          <span className="sm:hidden">Safety</span>
        </button>

        {/* Locate Me */}
        <button
          onClick={startLocationWatch}
          className="floating-btn bg-resq-card border border-resq-border/50 text-resq-text hover:bg-resq-border/20"
          title="Recenter and update my location"
        >
          <LocateFixed size={20} className={locationStatus === 'fetching' ? 'animate-spin text-resq-accent' : 'text-resq-accent'} />
          <span className="hidden sm:inline">Locate Me</span>
        </button>

        {/* Report Hazard */}
        <button
          onClick={() => {
            setReportCoords(userLocation || { lat: 18.5204, lng: 73.8567 });
            setShowReport(true);
          }}
          className="floating-btn bg-gradient-to-r from-amber-500 to-orange-600 text-white"
          title="Report a hazard at your current location"
        >
          <AlertTriangle size={20} />
          <span className="hidden sm:inline">Report Hazard</span>
          <span className="sm:hidden">Report</span>
        </button>
      </div>
    </div>
  );
}
