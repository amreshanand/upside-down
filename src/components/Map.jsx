import { useCallback, useRef, useState, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0a0e17' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e17' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#546e8a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#8fa4bd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#546e8a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f1a2b' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3a6b4f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#151d2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a2540' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1a2540' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e2d44' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8fa4bd' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#8fa4bd' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060a12' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2a3f5f' }] },
];

const libraries = ['places'];

// SVG marker icons as data URIs
function createMarkerIcon(color, glowColor) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M18 2C9.716 2 3 8.716 3 17c0 11.25 15 25 15 25s15-13.75 15-25C33 8.716 26.284 2 18 2z" 
            fill="${color}" stroke="${glowColor}" stroke-width="1.5" filter="url(#glow)" opacity="0.95"/>
      <circle cx="18" cy="17" r="6" fill="white" opacity="0.9"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const markerIcons = {
  danger: createMarkerIcon('#ef4444', '#ff6b6b'),
  safe: createMarkerIcon('#22c55e', '#4ade80'),
  hazard: createMarkerIcon('#f59e0b', '#fbbf24'),
};

const typeLabels = {
  danger: { label: 'Danger Zone', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
  safe: { label: 'Safe Zone', icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/15' },
  hazard: { label: 'Reported Hazard', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
};

function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Map({ zones, userLocation, onMapClick }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapRef = useRef(null);
  const [selectedZone, setSelectedZone] = useState(null);

  const center = useMemo(() => userLocation || { lat: 19.076, lng: 72.8777 }, [userLocation]);

  const options = useMemo(() => ({
    styles: darkMapStyles,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    minZoom: 4,
    maxZoom: 18,
    zoomControlOptions: {
      position: 3, // RIGHT_BOTTOM (approximate, will use google.maps.ControlPosition when available)
    },
  }), []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = useCallback((e) => {
    if (e.latLng) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, [onMapClick]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-resq-dark">
        <div className="glass-panel p-8 text-center max-w-md">
          <MapPin size={48} className="text-resq-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-resq-text mb-2">Map Unavailable</h2>
          <p className="text-resq-muted text-sm">
            Unable to load Google Maps. Please check your API key in the .env file.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-resq-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-3 border-resq-border border-t-resq-accent animate-spin" />
          <p className="text-resq-muted text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={options}
        onLoad={onLoad}
        onClick={handleMapClick}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: 0, // google.maps.SymbolPath.CIRCLE
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
            title="Your location"
            zIndex={1000}
          />
        )}

        {/* Zone markers */}
        {zones.map((zone) => (
          <Marker
            key={zone.id}
            position={{ lat: zone.lat, lng: zone.lng }}
            icon={{
              url: markerIcons[zone.type] || markerIcons.hazard,
              scaledSize: new window.google.maps.Size(36, 44),
              anchor: new window.google.maps.Point(18, 44),
            }}
            onClick={() => setSelectedZone(zone)}
            animation={zone.type === 'danger' ? 1 : undefined} // BOUNCE for danger
          />
        ))}

        {/* Info Window */}
        {selectedZone && (
          <InfoWindow
            position={{ lat: selectedZone.lat, lng: selectedZone.lng }}
            onCloseClick={() => setSelectedZone(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -44) }}
          >
            <div className="p-2 min-w-[200px]" style={{ background: '#1a2233', color: '#e2e8f0' }}>
              {(() => {
                const typeInfo = typeLabels[selectedZone.type] || typeLabels.hazard;
                const Icon = typeInfo.icon;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${typeInfo.bg}`}>
                        <Icon size={14} className={typeInfo.color} />
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{selectedZone.description}</p>
                    <p className="text-[10px] text-gray-500 mt-2">{getTimeAgo(selectedZone.timestamp)}</p>
                  </>
                );
              })()}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map Legend */}
      <div className="absolute bottom-24 right-4 z-20">
        <div className="glass-card p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-resq-muted font-semibold mb-1">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-xs text-resq-muted">Danger Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span className="text-xs text-resq-muted">Safe Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-xs text-resq-muted">Reported Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-xs text-resq-muted">You</span>
          </div>
        </div>
      </div>
    </div>
  );
}
