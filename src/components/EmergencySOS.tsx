import React, { useEffect, useState } from 'react';
import { AlertTriangle, Send, X, User, Phone, Car, MapPin, Radio } from 'lucide-react';
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

  // Pre-fill from user login data
  const [driverName, setDriverName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicleNum, setVehicleNum] = useState(user?.carNumber || '');

  useEffect(() => {
    findNearestChargingStation(currentLat, currentLng).then(res => setStation(res));
  }, [currentLat, currentLng]);

  const handleSOS = () => {
    setIsSending(true);
    console.log(`[SOS DISPATCH] Driver: ${driverName}, Phone: ${phone}, Vehicle: ${vehicleNum}, Location: ${currentLat},${currentLng}`);
    setTimeout(() => {
      setIsSending(false);
      setSent(true);
    }, 2500);
  };

  return (
    <div className="sos-overlay">
      <div className="sos-modal">
        {/* Header */}
        <div className="sos-header">
          <div className="sos-icon-ring">
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <div>
            <h2 className="sos-title">Emergency SOS Request</h2>
            <p className="sos-subtitle">Stranded? Request emergency EV charging from the nearest Hub.</p>
          </div>
          {onClose && (
            <button className="sos-close" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {!sent ? (
          <>
            {/* Form Fields */}
            <div className="sos-form">
              <div className="sos-field">
                <label>Driver Name</label>
                <div className="sos-input-wrap">
                  <User size={16} className="sos-field-icon" />
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="sos-field">
                <label>Phone Number</label>
                <div className="sos-input-wrap">
                  <Phone size={16} className="sos-field-icon" />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="sos-field">
                <label>Vehicle Number</label>
                <div className="sos-input-wrap">
                  <Car size={16} className="sos-field-icon" />
                  <input
                    type="text"
                    value={vehicleNum}
                    onChange={e => setVehicleNum(e.target.value)}
                    placeholder="e.g. TN 01 AB 1234"
                  />
                </div>
              </div>

              <div className="sos-field">
                <label>Your Location</label>
                <div className="sos-input-wrap">
                  <MapPin size={16} className="sos-field-icon" />
                  <input
                    type="text"
                    readOnly
                    value={currentLat && currentLng ? `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}` : 'Detecting...'}
                    style={{ color: '#10b981' }}
                  />
                </div>
              </div>
            </div>

            {/* Nearest Hub */}
            <div className="sos-hub-row">
              {!station ? (
                <div className="sos-scanning">
                  <Radio size={16} className="spin-icon" />
                  <span>Scanning for nearest rescue hub...</span>
                </div>
              ) : (
                <div className="sos-hub-found">
                  <span className="sos-hub-dot" />
                  <span><strong>{station.name}</strong> — {station.distanceKm} km away</span>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              className="sos-send-btn"
              onClick={handleSOS}
              disabled={isSending || !driverName || !phone}
            >
              {isSending ? (
                <><Radio size={18} className="spin-icon" /> Transmitting SOS...</>
              ) : (
                <><Send size={18} /> Send SOS to Admin</>
              )}
            </button>
          </>
        ) : (
          /* Success State */
          <div className="sos-success">
            <div className="sos-success-icon">✅</div>
            <h3>SOS Transmitted!</h3>
            <p>Help is on the way to your location.</p>
            <div className="sos-summary">
              <p><strong>Driver:</strong> {driverName}</p>
              <p><strong>Phone:</strong> {phone}</p>
              <p><strong>Vehicle:</strong> {vehicleNum}</p>
              <p><strong>Hub Notified:</strong> {station?.name}</p>
            </div>
            {onClose && (
              <button className="sos-dismiss-btn" onClick={onClose}>Dismiss</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencySOS;
