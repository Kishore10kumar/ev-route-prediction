import React, { useState, useEffect, useRef } from 'react';
import MapDisplay from './components/MapDisplay';
import ControlPanel from './components/ControlPanel';
import Login from './components/Login';
import EmergencySOS from './components/EmergencySOS';
import { fetchRouteFromCoords, fetchWeather, fetchChargingHubsAlongRoute, calculateDistance, RouteData, WeatherData } from './services/api';
import { AlertCircle } from 'lucide-react';

export interface AlertMessage {
  id: string;
  type: 'info' | 'warning' | 'danger';
  message: string;
  timestamp: Date;
}

function App() {
  const [user, setUser] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [hubs, setHubs] = useState<any[]>([]);
  
  const [predictedRange, setPredictedRange] = useState<number | null>(null);
  const [currentBattery, setCurrentBattery] = useState(80); // Default to 80 to match ControlPanel
  
  const [liveLocation, setLiveLocation] = useState<[number, number] | null>(null);
  const [lastLocation, setLastLocation] = useState<[number, number] | null>(null);
  const [focusedHub, setFocusedHub] = useState<any>(null);
  
  const [showEmergency, setShowEmergency] = useState(false);

  // Drive Mode State
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [heading, setHeading] = useState<number | null>(null);
  
  // Refs for tracking if alerts have fired
  const lowBatteryFired = useRef(false);
  const breakAlertFired = useRef(false);

  const BASE_RANGE_KM = 500; 

  // Persistence: Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ev_hub_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Automatic Device Battery Detection
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const level = Math.round(battery.level * 100);
        console.log(`[BATTERY DETECTED] Level: ${level}%`);
        setCurrentBattery(level);
        
        // Update whenever the physical battery level changes
        battery.addEventListener('levelchange', () => {
          const newLevel = Math.round(battery.level * 100);
          console.log(`[BATTERY UPDATED] New Level: ${newLevel}%`);
          setCurrentBattery(newLevel);
        });
      }).catch((err: any) => {
        console.warn("[BATTERY API ERROR]", err);
      });
    } else {
      console.warn("[BATTERY API NOT SUPPORTED] Using default 80%");
    }
  }, []);

  const handleLogin = (userData: any) => {
    localStorage.setItem('ev_hub_user', JSON.stringify(userData));
    setUser(userData);
  };

  const addAlert = (type: 'info' | 'warning' | 'danger', message: string) => {
    setAlerts(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date()
    }, ...prev]);
  };

  // Gyroscope/Compass Heading
  useEffect(() => {
    if (!isTripStarted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const compass = (event as any).webkitCompassHeading || (360 - (event.alpha || 0));
      if (compass !== undefined) {
        setHeading(compass);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isTripStarted]);

  const handleCalculate = async (dest: string, startBattery: number) => {
    if (!liveLocation) {
      alert("Waiting for GPS location... Please ensure location services are enabled.");
      return;
    }

    setIsLoading(true);
    setCurrentBattery(startBattery);
    setIsTripStarted(false);
    setAlerts([]);
    setActiveStepIndex(0);
    setHeading(null);
    lowBatteryFired.current = false;
    breakAlertFired.current = false;

    try {
      const route = await fetchRouteFromCoords(liveLocation, dest);
      const weather = await fetchWeather(route.path[0][0], route.path[0][1]);
      const routeHubs = await fetchChargingHubsAlongRoute(route.path);
      
      const sortedHubs = routeHubs.map(hub => ({
        ...hub,
        distanceKm: calculateDistance(liveLocation[0], liveLocation[1], hub.location[0], hub.location[1])
      })).sort((a, b) => a.distanceKm - b.distanceKm);

      setHubs(sortedHubs);

      const range = calculateDynamicRange(BASE_RANGE_KM, startBattery, weather.temperature, route.trafficLevel);

      setRouteData(route);
      setWeatherData(weather);
      setPredictedRange(range);
      
    } catch (error: any) {
      console.error("Failed to calculate route:", error);
      alert(error.message || "Failed to calculate route. Try entering a more specific city name.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDynamicRange = (base: number, battery: number, temp: number, traffic: string) => {
    let range = base * (battery / 100);
    if (temp < 10) range *= 0.85;
    else if (temp > 35) range *= 0.9;
    if (traffic === 'HEAVY') range *= 0.75;
    else if (traffic === 'MEDIUM') range *= 0.9;
    return Math.round(range);
  };

  const startTrip = () => {
    setIsTripStarted(true);
    setActiveStepIndex(0);
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission();
    }
    if (routeData) {
      if (routeData.trafficLevel === 'HEAVY') addAlert('danger', 'Heavy traffic detected ahead.');
      else if (routeData.trafficLevel === 'MEDIUM') addAlert('warning', 'Moderate traffic expected.');
      else addAlert('info', 'Traffic is light.');
    }
  };

  const cancelTrip = () => {
    setIsTripStarted(false);
    setActiveStepIndex(0);
    setRouteData(null);
    setHubs([]);
    setAlerts([]);
    setPredictedRange(null);
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        if (lastLocation && isTripStarted) {
          const d = calculateDistance(lastLocation[0], lastLocation[1], newLoc[0], newLoc[1]);
          if (d > 0.01) {
            const drain = d * (100 / BASE_RANGE_KM);
            setCurrentBattery(b => Math.max(0, b - drain));
            setLastLocation(newLoc);
            if (Math.random() > 0.7) {
               setActiveStepIndex(prev => (routeData && prev < routeData.navSteps.length - 1) ? prev + 1 : prev);
            }
          }
        } else if (!lastLocation) {
          setLastLocation(newLoc);
        }
        setLiveLocation(newLoc);
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [lastLocation, isTripStarted, routeData]);

  useEffect(() => {
    if (isTripStarted && currentBattery < 20 && !lowBatteryFired.current) {
      addAlert('danger', `CRITICAL: Battery level at ${Math.round(currentBattery)}%.`);
      lowBatteryFired.current = true;
    }
  }, [currentBattery, isTripStarted]);

  // Calculate live metrics for Drive Mode
  const remainingDistance = routeData?.navSteps 
    ? routeData.navSteps.slice(activeStepIndex).reduce((sum, step) => sum + step.distance, 0) / 1000 
    : 0;
  
  const batteryAtDest = (predictedRange && predictedRange > 0)
    ? currentBattery - (remainingDistance / predictedRange) * currentBattery
    : currentBattery;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* ... (Emergency Button) ... */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 1000 }}>
        <button className="btn btn-danger" style={{ padding: '16px 24px', borderRadius: '50px' }} onClick={() => setShowEmergency(true)}>
          <AlertCircle size={24} /> EMERGENCY
        </button>
      </div>

      <MapDisplay 
        routePath={routeData?.path || null} 
        trafficSegments={routeData?.trafficSegments || null}
        trafficLevel={routeData?.trafficLevel || null} 
        liveLocation={liveLocation}
        hubs={hubs}
        focusLocation={focusedHub?.location || null}
        user={user}
        isTripStarted={isTripStarted}
        heading={heading}
      />
      
      <ControlPanel 
        onCalculate={handleCalculate}
        isLoading={isLoading}
        predictedRange={predictedRange}
        requiredDistance={routeData?.distanceKm || null}
        weather={weatherData ? { temp: weatherData.temperature, cond: weatherData.condition } : null}
        liveBattery={currentBattery}
        hubs={hubs}
        hasLiveLocation={!!liveLocation}
        onHubClick={setFocusedHub}
        isTripStarted={isTripStarted}
        startTrip={startTrip}
        onCancelTrip={cancelTrip}
        alerts={alerts}
        navSteps={routeData?.navSteps || []}
        activeStepIndex={activeStepIndex}
        remainingDistance={remainingDistance}
        batteryAtDest={batteryAtDest}
      />

      {showEmergency && (
        <EmergencySOS
          currentLat={liveLocation?.[0] || 12.9716}
          currentLng={liveLocation?.[1] || 77.5946}
          user={user}
          onClose={() => setShowEmergency(false)}
        />
      )}
    </div>
  );
}

export default App;
