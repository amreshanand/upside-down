import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Map from '../components/Map';
import AlertFeed from '../components/AlertFeed';
import ReportModal from '../components/ReportModal';
import AIChat from '../components/AIChat';
import NotificationHub from '../components/NotificationHub';
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
      // Create dummy data near the user's current location for demonstration
      const baseLat = userLocation?.lat || 19.076;
      const baseLng = userLocation?.lng || 72.8777;

      const dummyZones = [
        { 
          id: 'demo-danger-1', 
          type: 'danger', 
          lat: baseLat + 0.008, 
          lng: baseLng + 0.006, 
          description: 'CRITICAL: Severe waterlogging at Main Square. Avoid for next 4 hours.', 
          timestamp: Date.now() - 3600000,
          confirmations: ['a1', 'a2', 'a3'] 
        },
        { 
          id: 'demo-danger-2', 
          type: 'danger', 
          lat: baseLat - 0.007, 
          lng: baseLng + 0.012, 
          description: 'EMERGENCY: Power lines down. Hazardous area. Utility crews on site.', 
          timestamp: Date.now() - 1500000,
          confirmations: ['b1', 'b2', 'b3', 'b4'] 
        },
        { 
          id: 'demo-safe-1', 
          type: 'safe', 
          lat: baseLat - 0.012, 
          lng: baseLng - 0.008, 
          description: 'SAFE ZONE: Central High School Shelter. Medical staff present.', 
          timestamp: Date.now() - 7200000,
          confirmations: []
        },
        { 
          id: 'demo-safe-2', 
          type: 'safe', 
          lat: baseLat + 0.015, 
          lng: baseLng - 0.002, 
          description: 'SAFE ZONE: Westside Church Shelter. Food and water available.', 
          timestamp: Date.now() - 10800000,
          confirmations: []
        },
        { 
          id: 'demo-hazard-1', 
          type: 'hazard', 
          lat: baseLat + 0.004, 
          lng: baseLng - 0.005, 
          description: 'HAZARD: Large sinkhole opening near Park Street intersection.', 
          timestamp: Date.now() - 1800000,
          confirmations: ['user-1'] 
        },
        { 
          id: 'demo-hazard-2', 
          type: 'hazard', 
          lat: baseLat - 0.003, 
          lng: baseLng + 0.004, 
          description: 'HAZARD: Major traffic jam due to landslide debris.', 
          timestamp: Date.now() - 900000,
          confirmations: ['user-2', 'user-3'] 
        },
        { 
          id: 'demo-hazard-3', 
          type: 'hazard', 
          lat: baseLat + 0.010, 
          lng: baseLng + 0.002, 
          description: 'HAZARD: Broken water main causing slippery road conditions.', 
          timestamp: Date.now() - 5400000,
          confirmations: [] 
        }
      ];
      // Filter out any real data that is further than 10km away to keep it hyperlocal
      const filterByDistance = (lat, lng) => {
        if (!userLocation) return true; // Show all if location not yet loaded
        const R = 6371; // Radius of the earth in km
        const dLat = (lat - userLocation.lat) * Math.PI / 180;
        const dLon = (lng - userLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // Distance in km
        return d <= 10; // Only show within 10km
      };

      const zoneData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(z => filterByDistance(z.lat, z.lng));

      setZones([...dummyZones, ...zoneData]);
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

      {/* Notification Hub (Toasts) */}
      <NotificationHub alerts={alerts} />

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
