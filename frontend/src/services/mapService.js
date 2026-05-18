// Map utility service — routing, geolocation, distance

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || "";

// Transport mode → ORS profile mapping
const PROFILES = {
  car: "driving-car",
  walk: "foot-walking",
  bike: "cycling-regular", // closest to two-wheeler
};

/**
 * Fetch a driving route from OpenRouteService
 * Returns { route: [[lat,lng]...], distance (km), duration (min) } or null
 */
export const fetchRoute = async (startCoords, endCoords, mode = "car") => {
  if (!ORS_API_KEY) return null;

  const profile = PROFILES[mode] || PROFILES.car;

  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const coords = feature.geometry.coordinates;
      // ORS returns [lng, lat] — Leaflet needs [lat, lng]
      const route = coords.map(([lng, lat]) => [lat, lng]);

      const summary = feature.properties?.summary || {};
      const distanceKm = (summary.distance / 1000).toFixed(1); // meters → km
      const durationMin = Math.ceil(summary.duration / 60); // seconds → minutes

      return { route, distance: parseFloat(distanceKm), duration: durationMin };
    }
    return null;
  } catch (error) {
    console.error("Route fetch failed:", error);
    return null;
  }
};

/**
 * Get user's current GPS location as a Promise
 * Returns [lat, lng]
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

/**
 * Watch user's GPS location continuously
 * Returns a watchId that can be cleared with navigator.geolocation.clearWatch(id)
 */
export const watchUserLocation = (onUpdate, onError) => {
  if (!navigator.geolocation) {
    onError?.(new Error("Geolocation not supported"));
    return null;
  }
  return navigator.geolocation.watchPosition(
    (position) => {
      onUpdate([position.coords.latitude, position.coords.longitude]);
    },
    (error) => {
      onError?.(error);
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
  );
};

/**
 * Calculate straight-line distance between two [lat, lng] points
 * Returns distance in km (rounded to 1 decimal)
 */
export const calculateDistance = (coords1, coords2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((coords2[0] - coords1[0]) * Math.PI) / 180;
  const dLon = ((coords2[1] - coords1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1[0] * Math.PI) / 180) *
      Math.cos((coords2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

/**
 * Convert MongoDB [lng, lat] coordinates to Leaflet [lat, lng]
 */
export const toLeaflet = (mongoCoords) => {
  if (!mongoCoords || mongoCoords.length < 2) return [0, 0];
  return [mongoCoords[1], mongoCoords[0]];
};

/**
 * Format duration nicely
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
};
