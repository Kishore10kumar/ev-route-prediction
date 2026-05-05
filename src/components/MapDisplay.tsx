import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Sleek Pulsing Dot for Live Location
const LiveLocationIcon = new L.DivIcon({
  html: `<div class="pulsing-dot"></div>`,
  className: 'live-location-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Hub Icon
const HubIcon = new L.DivIcon({
  html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">⚡</div>`,
  className: 'hub-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface Hub {
  id: string;
  name: string;
  location: [number, number];
  availablePorts: number;
  fastCharging: boolean;
}

interface MapDisplayProps {
  routePath: [number, number][] | null;
  trafficSegments?: { path: [number, number][], color: string }[] | null;
  trafficLevel: 'LOW' | 'MEDIUM' | 'HEAVY' | null;
  liveLocation: [number, number] | null;
  hubs: Hub[];
  focusLocation?: [number, number] | null;
  user?: any;
  isTripStarted?: boolean;
  heading: number | null;
}

const MapUpdater: React.FC<{ path: [number, number][] | null, focusLocation?: [number, number] | null, liveLocation?: [number, number] | null, isTripStarted?: boolean }> = ({ path, focusLocation, liveLocation, isTripStarted }) => {
  const map = useMap();
  
  useEffect(() => {
    // If we have a route but no focus location yet, fit the route
    if (path && path.length > 0 && !focusLocation && !isTripStarted) {
      const bounds = L.latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [path, focusLocation, map, isTripStarted]);

  useEffect(() => {
    // Focus location dynamically (either live dot or a clicked hub)
    if (focusLocation) {
      map.setView(focusLocation, 14, { animate: true, duration: 1 });
    } else if (isTripStarted && liveLocation) {
      // Auto-pan to live location during trip
      map.setView(liveLocation, 16, { animate: true, duration: 1 });
    }
  }, [focusLocation, liveLocation, isTripStarted, map]);
  
  return null;
};

const MapDisplay: React.FC<MapDisplayProps> = ({ routePath, trafficSegments, trafficLevel, liveLocation, hubs, focusLocation, user, isTripStarted, heading }) => {
  
  const getTrafficColor = () => {
    if (trafficLevel === 'HEAVY') return '#ef4444'; 
    if (trafficLevel === 'MEDIUM') return '#f59e0b'; 
    return '#10b981'; 
  };

  const handleReserve = (hubName: string) => {
    if (!user) {
      alert(`Reservation request sent to ${hubName}!`);
    } else {
      alert(`Reservation Request Transmitted!\n\nTo: ${hubName}\nDriver: ${user.name}\nVehicle: ${user.carNumber}\nContact: ${user.phone}\n\nThe station has been notified of your arrival.`);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      {/* Inject custom styles for the pulsing dot */}
      <style>
        {`
          .pulsing-dot {
            width: 16px;
            height: 16px;
            background-color: var(--primary-color);
            border-radius: 50%;
            box-shadow: 0 0 0 rgba(14, 165, 233, 0.4);
            animation: pulse-dot 1.5s infinite;
            border: 2px solid white;
            transition: transform 0.3s ease;
            ${heading !== null ? `transform: rotate(${heading}deg);` : ''}
          }
          
          /* Navigation arrow indicator inside dot */
          .pulsing-dot::after {
            content: '';
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 12px solid var(--primary-color);
            display: ${isTripStarted ? 'block' : 'none'};
          }

          @keyframes pulse-dot {
            0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(14, 165, 233, 0); }
            100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
          }
          .hub-popup .leaflet-popup-content-wrapper {
            background: var(--glass-bg);
            color: white;
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
          }
          .hub-popup .leaflet-popup-tip {
            background: var(--glass-bg);
          }
        `}
      </style>

      <MapContainer 
        center={[12.9716, 77.5946]} // Default to Bangalore 
        zoom={13} 
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        
        <MapUpdater path={routePath} focusLocation={focusLocation} liveLocation={liveLocation} isTripStarted={isTripStarted} />

        {routePath && (
          <>
            {trafficSegments && trafficSegments.length > 0 ? (
              trafficSegments.map((segment, idx) => (
                <Polyline 
                  key={`segment-${idx}`}
                  positions={segment.path} 
                  color={segment.color} 
                  weight={6} 
                  opacity={0.9}
                  className="animated-route"
                />
              ))
            ) : (
              <Polyline 
                positions={routePath} 
                color={getTrafficColor()} 
                weight={6} 
                opacity={0.8}
                className="animated-route"
              />
            )}
            
            {!liveLocation && (
              <Marker position={routePath[0]}>
                <Popup>Starting Point</Popup>
              </Marker>
            )}
            
            <Marker position={routePath[routePath.length - 1]}>
              <Popup>Destination</Popup>
            </Marker>
          </>
        )}

        {/* Render Charging Hubs */}
        {hubs.map(hub => (
          <Marker key={hub.id} position={hub.location} icon={HubIcon}>
            <Popup className="hub-popup">
              <div style={{ padding: '4px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--primary-color)' }}>{hub.name}</h3>
                <p style={{ margin: '4px 0' }}><strong>Available Ports:</strong> {hub.availablePorts}</p>
                <p style={{ margin: '4px 0' }}><strong>Fast Charging:</strong> {hub.fastCharging ? 'Yes ⚡' : 'No'}</p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '8px', padding: '6px' }}
                  onClick={() => handleReserve(hub.name)}
                >
                  Reserve Port
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Live Location Dot */}
        {liveLocation && (
          <Marker position={liveLocation} icon={LiveLocationIcon} />
        )}

        <MapUpdater path={routePath} focusLocation={focusLocation || liveLocation} />
      </MapContainer>
    </div>
  );
};

export default MapDisplay;
