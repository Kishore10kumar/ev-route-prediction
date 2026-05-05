import React, { useState } from 'react';
import { 
  MapPin, Battery, Thermometer, Navigation, Zap, 
  AlertTriangle, Coffee, Info, Play, ChevronRight, X,
  ArrowUp, ArrowUpLeft, ArrowUpRight, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight
} from 'lucide-react';
import { AlertMessage } from '../App';
import './ControlPanel.css';

interface Hub {
  id: string;
  name: string;
  location: [number, number];
  availablePorts: number;
  fastCharging: boolean;
  distanceKm?: number;
}

interface NavStep {
  instruction: string;
  distance: number;
  modifier?: string;
  type?: string;
}

interface ControlPanelProps {
  onCalculate: (dest: string, battery: number) => void;
  isLoading: boolean;
  predictedRange: number | null;
  requiredDistance: number | null;
  weather: { temp: number; cond: string } | null;
  liveBattery?: number;
  hubs: Hub[];
  hasLiveLocation: boolean;
  onHubClick?: (hub: Hub) => void;
  isTripStarted: boolean;
  startTrip: () => void;
  onCancelTrip: () => void;
  alerts: AlertMessage[];
  navSteps?: NavStep[];
  activeStepIndex?: number;
  remainingDistance?: number;
  batteryAtDest?: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onCalculate, 
  isLoading, 
  predictedRange, 
  requiredDistance,
  weather,
  liveBattery,
  hubs,
  hasLiveLocation,
  onHubClick,
  isTripStarted,
  startTrip,
  onCancelTrip,
  alerts,
  navSteps = [],
  activeStepIndex = 0,
  remainingDistance,
  batteryAtDest
}) => {
  const [dest, setDest] = useState('');
  const [battery, setBattery] = useState(80);

  // Sync slider with real device battery on load
  useEffect(() => {
    if (liveBattery !== undefined && !isTripStarted) {
      setBattery(liveBattery);
    }
  }, [liveBattery, isTripStarted]);

  const displayBattery = liveBattery !== undefined ? Math.round(liveBattery) : battery;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest) {
        alert("Please enter a destination");
        return;
    }
    onCalculate(dest, battery);
  };

  const isEmergency = predictedRange !== null && requiredDistance !== null && predictedRange < requiredDistance;
  const batteryRequired = requiredDistance !== null && predictedRange !== null 
    ? Math.round((requiredDistance / predictedRange) * displayBattery) 
    : 0;

  const renderAlertIcon = (type: string, message: string) => {
    if (type === 'danger') return <AlertTriangle size={18} />;
    if (type === 'warning') return <AlertTriangle size={18} />;
    return <Info size={18} />;
  };

  const getNavIcon = (modifier?: string) => {
    if (modifier?.includes('left')) return <ArrowUpLeft size={32} />;
    if (modifier?.includes('right')) return <ArrowUpRight size={32} />;
    if (modifier?.includes('straight')) return <ArrowUp size={32} />;
    return <ArrowUp size={32} />;
  };

  const currentStep = navSteps[activeStepIndex];

  return (
    <div className="control-panel glass-panel">
      <div className="panel-header">
        <h2>{isTripStarted ? 'Live Navigation' : 'EV Route Intelligence'}</h2>
        <p className="subtitle">{isTripStarted ? 'Following GPS coordinates' : 'AI-Powered Route Analytics'}</p>
      </div>

      {!isTripStarted ? (
        <>
          <form onSubmit={handleSubmit} className="panel-form">
            <div className="input-group">
              <label className="input-label">Destination</label>
              <div className="input-with-icon">
                <Navigation size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="input-field" 
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  placeholder="Enter destination city..."
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Current Battery: {displayBattery}%</label>
              <div className="slider-container">
                <Battery size={18} className="input-icon battery-icon" style={{ color: displayBattery > 20 ? 'var(--accent-color)' : 'var(--danger-color)'}} />
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={displayBattery}
                  onChange={(e) => setBattery(Number(e.target.value))}
                  className="battery-slider"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary calculate-btn" disabled={isLoading || !hasLiveLocation}>
              {!hasLiveLocation ? 'Waiting for GPS...' : isLoading ? 'Optimizing...' : 'Optimize Route'}
            </button>
          </form>

          <div className="metrics-container">
            {weather && (
              <div className="metric-card glass-panel">
                <Thermometer size={20} color="var(--primary-color)" />
                <div className="metric-data">
                  <span className="metric-title">Weather Factor</span>
                  <span className="metric-value">{weather.temp}°C, {weather.cond}</span>
                </div>
              </div>
            )}

            {requiredDistance !== null && (
              <div className="metric-card glass-panel">
                <Navigation size={20} color="var(--text-muted)" />
                <div className="metric-data">
                  <span className="metric-title">Trip Distance</span>
                  <span className="metric-value">{requiredDistance} km</span>
                </div>
              </div>
            )}

            {predictedRange !== null && (
              <div className={`metric-card glass-panel main-metric ${isEmergency ? 'emergency-glow' : ''}`}>
                <Battery size={24} color={isEmergency ? 'var(--danger-color)' : 'var(--accent-color)'} />
                <div className="metric-data">
                  <span className="metric-title">Est. Battery Usage</span>
                  <span className={`metric-value large ${isEmergency ? 'danger-text' : ''}`}>
                    {batteryRequired > displayBattery ? 'EXCEEDS CAPACITY' : `${batteryRequired}%`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {predictedRange !== null && (
            <button 
              className="btn btn-primary" 
              style={{ padding: '16px', fontSize: '1.2rem', marginTop: '8px', animation: 'pulse 2s infinite' }}
              onClick={startTrip}
            >
              <Play size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              START TRIP
            </button>
          )}

          {hubs.length > 0 && (
            <div className="station-comparison">
              <h3 className="comparison-title">Station Level Comparison</h3>
              <div className="hubs-list">
                {hubs.map((hub) => (
                  <div 
                    key={hub.id} 
                    className="hub-item glass-panel" 
                    onClick={() => onHubClick && onHubClick(hub)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="hub-info">
                      <h4>{hub.name}</h4>
                      <span className="hub-ports">
                        {hub.availablePorts} Ports Available 
                        {hub.distanceKm !== undefined && ` • ${hub.distanceKm.toFixed(1)} km away`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="drive-mode-container">
          {currentStep && (
            <div className="nav-banner glass-panel" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--accent-color)' }}>
              <div className="nav-icon-container">
                {getNavIcon(currentStep.modifier)}
              </div>
              <div className="nav-text">
                <span className="nav-distance">In {currentStep.distance} meters</span>
                <h4 className="nav-instruction">{currentStep.instruction}</h4>
              </div>
            </div>
          )}

          <div className="live-metrics-grid" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="metric-card glass-panel">
              <Battery size={20} color={displayBattery > 20 ? 'var(--accent-color)' : 'var(--danger-color)'} />
              <div className="metric-data">
                <span className="metric-title">Current Battery</span>
                <span className={`metric-value ${displayBattery <= 20 ? 'danger-text' : ''}`}>
                  {displayBattery}%
                </span>
              </div>
            </div>
            
            <div className="metric-card glass-panel">
              <Navigation size={20} color="var(--primary-color)" />
              <div className="metric-data">
                <span className="metric-title">Distance Left</span>
                <span className="metric-value">
                  {remainingDistance !== undefined ? `${remainingDistance.toFixed(1)} km` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="live-metrics" style={{ marginTop: '10px' }}>
            <div className="metric-card glass-panel main-metric" style={{ background: 'rgba(14, 165, 233, 0.05)' }}>
              <Zap size={24} color="var(--primary-color)" />
              <div className="metric-data">
                <span className="metric-title">Est. Battery at Arrival</span>
                <span className="metric-value">
                  {batteryAtDest !== undefined ? `${Math.max(0, Math.round(batteryAtDest))}%` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="alerts-feed">
            <h3 className="comparison-title" style={{ marginBottom: '8px' }}>Live Alerts</h3>
            {alerts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Monitoring systems...</p>
            ) : (
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-item glass-panel alert-${alert.type}`}>
                    <div className={`alert-icon-wrapper type-${alert.type}`}>
                      {renderAlertIcon(alert.type, alert.message)}
                    </div>
                    <div className="alert-content">
                      <p className="alert-message" style={{ fontSize: '0.8rem' }}>{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="btn btn-secondary cancel-trip-btn" 
            style={{ 
              marginTop: '16px', 
              width: '100%', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'var(--danger-color)',
              border: '1px solid rgba(239, 68, 68, 0.2)' 
            }}
            onClick={onCancelTrip}
          >
            <X size={18} style={{ marginRight: '8px' }} />
            CANCEL TRIP
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
