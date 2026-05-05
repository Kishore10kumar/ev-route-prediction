import React, { useEffect, useState } from 'react';
import { AlertTriangle, Zap, Radio } from 'lucide-react';
import { findNearestChargingStation } from '../services/api';
import './EmergencySOS.css';

interface EmergencySOSProps {
  currentLat: number;
  currentLng: number;
  user: any;
  onClose?: () => void;
}

const EmergencySOS: React.FC<EmergencySOSProps> = ({ currentLat, currentLng, user, onClose }) => {
  const [station, setStation] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    findNearestChargingStation(currentLat, currentLng).then(res => {
      setStation(res);
    });
  }, [currentLat, currentLng]);

  const handleSOS = () => {
    setIsSending(true);
    // Simulate dispatch with User Details
    console.log(`[SOS DISPATCH] User: ${user.name}, Phone: ${user.phone}, Car: ${user.carNumber}`);
    setTimeout(() => {
      setIsSending(false);
      setSent(true);
    }, 2000);
  };

  return (
    <div className="emergency-sos-modal glass-panel">
      {onClose && (
        <button className="close-btn" onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>
          ✕
        </button>
      )}
      <div className="sos-header">
        <AlertTriangle size={32} color="var(--danger-color)" />
        <div className="sos-title">
          <h3>EMERGENCY SOS PROTOCOL</h3>
          <p>Driver: {user?.name} | Vehicle: {user?.carNumber}</p>
        </div>
      </div>

      <div className="sos-content">
        {!station ? (
          <div className="scanning">
            <Radio className="spin-icon" size={24} />
            <span>Scanning for nearest rescue hub...</span>
          </div>
        ) : (
          <div className="station-info">
            <div className="station-details">
              <h4>Nearest Hub: {station.name}</h4>
              <p>{station.distanceKm} km away</p>
            </div>
            
            {!sent ? (
              <button 
                className="btn btn-danger sos-btn" 
                onClick={handleSOS}
                disabled={isSending}
              >
                <Zap size={18} />
                {isSending ? 'Transmitting Data...' : 'Dispatch Rescue Service'}
              </button>
            ) : (
              <div className="sos-success">
                <div className="success-badge">Rescue Dispatched</div>
                <p>Help is on the way to your location.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencySOS;
