import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Map from '../components/Map';
import AlertFeed from '../components/AlertFeed';
import ReportModal from '../components/ReportModal';
import AIChat from '../components/AIChat';
import { AlertTriangle, Navigation } from 'lucide-react';

export default function Home({ user }) {
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportCoords, setReportCoords] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError('Location access denied. Using default location.');
          // Default to Mumbai
          setUserLocation({ lat: 19.076, lng: 72.8777 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLocation({ lat: 19.076, lng: 72.8777 });
    }
  }, []);

  // Real-time zones listener
  useEffect(() => {
    const q = query(collection(db, 'zones'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const zoneData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setZones(zoneData);
    }, (error) => {
      console.error('Zones listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Real-time alerts listener
  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlerts(alertData);
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

      {/* Location error toast */}
      {locationError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-slide-down">
          <div className="glass-card px-4 py-2 flex items-center gap-2 text-sm text-amber-400">
            <AlertTriangle size={14} />
            {locationError}
          </div>
        </div>
      )}

      {/* Map */}
      <Map
        zones={zones}
        userLocation={userLocation}
        onMapClick={handleMapClick}
      />

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

        {/* Report Hazard */}
        <button
          onClick={() => {
            if (userLocation) {
              setReportCoords(userLocation);
            }
            setShowReport(true);
          }}
          className="floating-btn bg-gradient-to-r from-amber-500 to-orange-600 text-white"
          title="Report a hazard"
        >
          <AlertTriangle size={20} />
          <span className="hidden sm:inline">Report Hazard</span>
          <span className="sm:hidden">Report</span>
        </button>
      </div>
    </div>
  );
}
