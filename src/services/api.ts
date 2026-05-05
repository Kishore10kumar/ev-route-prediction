export interface TrafficSegment {
  path: [number, number][];
  color: string; // '#10b981' (green), '#f59e0b' (yellow), '#ef4444' (red)
}

export interface NavStep {
  instruction: string;
  distance: number;
  modifier?: string;
  type?: string;
}

export interface RouteData {
  path: [number, number][]; // Full path
  distanceKm: number;
  trafficLevel: 'LOW' | 'MEDIUM' | 'HEAVY';
  trafficSegments: TrafficSegment[];
  navSteps: NavStep[];
}

export interface WeatherData {
  temperature: number; // Celsius
  condition: string;
}

// Haversine formula to calculate distance between two coordinates
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
};

// Helper to geocode city name to coords
export const geocode = async (query: string): Promise<[number, number]> => {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (data && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  throw new Error(`Location not found: ${query}`);
};

export const fetchRoute = async (startQuery: string, destinationQuery: string): Promise<RouteData> => {
  const startCoords = await geocode(startQuery);
  const destCoords = await geocode(destinationQuery);
  return fetchRouteFromCoords(startCoords, destCoords);
};

export const fetchRouteFromCoords = async (startCoords: [number, number], destCoordsOrQuery: string | [number, number]): Promise<RouteData> => {
  let destCoords: [number, number];
  
  if (typeof destCoordsOrQuery === 'string') {
    destCoords = await geocode(destCoordsOrQuery);
  } else {
    destCoords = destCoordsOrQuery;
  }

  // Include steps=true for navigation
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson&steps=true`;
  
  const response = await fetch(osrmUrl);
  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('Could not find a route');
  }

  const route = data.routes[0];
  const distanceKm = Math.round(route.distance / 1000);
  
  const path: [number, number][] = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);

  // Parse navigation steps
  const navSteps: NavStep[] = [];
  if (route.legs && route.legs[0].steps) {
    route.legs[0].steps.forEach((step: any) => {
      let instruction = '';
      const modifier = step.maneuver.modifier || '';
      const type = step.maneuver.type || '';
      const name = step.name || 'Road';

      if (type === 'depart') instruction = `Drive from start point`;
      else if (type === 'arrive') instruction = `Arrive at destination`;
      else {
        instruction = `${type.charAt(0).toUpperCase() + type.slice(1)} ${modifier} onto ${name}`;
      }

      navSteps.push({
        instruction,
        distance: Math.round(step.distance),
        modifier,
        type
      });
    });
  }

  // Generate Google Maps style traffic segments
  const trafficSegments: TrafficSegment[] = [];
  const chunkSize = Math.max(10, Math.floor(path.length / 15)); // Break path into ~15 segments
  
  for (let i = 0; i < path.length; i += chunkSize) {
    // Ensure the segments overlap by 1 point so the polyline connects seamlessly
    const endIdx = Math.min(i + chunkSize + 1, path.length);
    const segmentPath = path.slice(i, endIdx);
    
    // Simulate traffic conditions: mostly green, some yellow, rare red
    const rand = Math.random();
    let color = '#10b981'; // Green (Fast)
    if (rand > 0.85) color = '#ef4444'; // Red (Heavy)
    else if (rand > 0.6) color = '#f59e0b'; // Yellow (Medium)

    trafficSegments.push({ path: segmentPath, color });
  }

  return {
    path,
    distanceKm,
    trafficLevel: distanceKm > 100 ? 'MEDIUM' : 'LOW',
    trafficSegments,
    navSteps
  };
};

export const fetchWeather = async (lat: number, lng: number): Promise<WeatherData> => {
  // We use open-meteo for free weather without an API key
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
  const data = await response.json();
  
  if (data && data.current_weather) {
    return {
      temperature: data.current_weather.temperature,
      condition: 'Clear', // Open-Meteo provides weather codes, keeping it simple
    };
  }
  
  // Fallback
  return {
    temperature: 22,
    condition: 'Clear',
  };
};

/**
 * Core Algorithm for Dynamic Range Prediction
 */
export const calculateDynamicRange = (
  baseRangeKm: number,
  batteryPercent: number,
  temperature: number,
  trafficLevel: 'LOW' | 'MEDIUM' | 'HEAVY'
): number => {
  let currentRange = baseRangeKm * (batteryPercent / 100);

  if (temperature < 10) {
    currentRange *= 0.85;
  } else if (temperature < 0) {
    currentRange *= 0.70;
  }

  if (trafficLevel === 'HEAVY') {
    currentRange *= 0.90;
  }

  return Math.round(currentRange);
};

export const findNearestChargingStation = async (lat: number, lng: number) => {
  // Use Nominatim to find nearest charging station
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=charging+station&limit=1&lat=${lat}&lon=${lng}&radius=10`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        name: data[0].display_name.split(',')[0] || "Public EV Charger",
        distanceKm: 2.3, // Approximate mock distance for demo
        location: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
        availablePorts: Math.floor(Math.random() * 4) + 1
      };
    }
  } catch (e) {
    console.error(e);
  }

  // Fallback
  return {
    name: "ChargePoint Supercharger",
    distanceKm: 2.3,
    location: [lat + 0.02, lng + 0.02],
    availablePorts: 4
  };
};

export const fetchChargingHubsAlongRoute = async (path: [number, number][]) => {
  if (path.length === 0) return [];

  // Sample up to 30 points evenly along the route to form a tight corridor
  const numSamples = Math.min(30, path.length);
  const step = Math.max(1, Math.floor(path.length / numSamples));
  const sampledPoints = [];
  for (let i = 0; i < path.length; i += step) {
    sampledPoints.push(`${path[i][0]},${path[i][1]}`);
  }
  // Ensure destination is always included
  if (!sampledPoints.includes(`${path[path.length - 1][0]},${path[path.length - 1][1]}`)) {
    sampledPoints.push(`${path[path.length - 1][0]},${path[path.length - 1][1]}`);
  }

  // Build Overpass API query using a single around clause with multiple points (forms a corridor)
  // 1500 meters radius from the route path points
  const coordsString = sampledPoints.join(',');
  const overpassQuery = `
    [out:json][timeout:15];
    (
      node["amenity"="charging_station"](around:1500, ${coordsString});
    );
    out body;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery
    });
    const data = await response.json();
    
    if (data && data.elements) {
      return data.elements.map((el: any) => {
        const name = el.tags?.name || el.tags?.operator || 'Public Charging Station';
        const capacity = parseInt(el.tags?.capacity) || Math.floor(Math.random() * 6) + 2;
        const isFast = el.tags?.['socket:type2:output'] !== undefined || el.tags?.fast_charge === 'yes' || Math.random() > 0.5;

        return {
          id: el.id.toString(),
          name: name,
          location: [el.lat, el.lon] as [number, number],
          availablePorts: capacity,
          fastCharging: isFast
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Overpass API error:", error);
    return [];
  }
};
