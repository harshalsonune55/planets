/**
 * Places the almanac can be computed for.
 *
 * Panchanga is sunrise-based, so every calculation needs coordinates and a
 * UTC offset — nothing else about the user is required.
 */

export type Place = {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: number;
};

export const PLACES: Place[] = [
  { id: "mumbai",     name: "Mumbai",     region: "Maharashtra, India", latitude: 19.076,  longitude: 72.8777, timezone: 5.5 },
  { id: "delhi",      name: "New Delhi",  region: "Delhi, India",       latitude: 28.6139, longitude: 77.209,  timezone: 5.5 },
  { id: "bengaluru",  name: "Bengaluru",  region: "Karnataka, India",   latitude: 12.9716, longitude: 77.5946, timezone: 5.5 },
  { id: "chennai",    name: "Chennai",    region: "Tamil Nadu, India",  latitude: 13.0827, longitude: 80.2707, timezone: 5.5 },
  { id: "kolkata",    name: "Kolkata",    region: "West Bengal, India", latitude: 22.5726, longitude: 88.3639, timezone: 5.5 },
  { id: "hyderabad",  name: "Hyderabad",  region: "Telangana, India",   latitude: 17.385,  longitude: 78.4867, timezone: 5.5 },
  { id: "pune",       name: "Pune",       region: "Maharashtra, India", latitude: 18.5204, longitude: 73.8567, timezone: 5.5 },
  { id: "ahmedabad",  name: "Ahmedabad",  region: "Gujarat, India",     latitude: 23.0225, longitude: 72.5714, timezone: 5.5 },
  { id: "jaipur",     name: "Jaipur",     region: "Rajasthan, India",   latitude: 26.9124, longitude: 75.7873, timezone: 5.5 },
  { id: "lucknow",    name: "Lucknow",    region: "Uttar Pradesh, India", latitude: 26.8467, longitude: 80.9462, timezone: 5.5 },
  { id: "varanasi",   name: "Varanasi",   region: "Uttar Pradesh, India", latitude: 25.3176, longitude: 82.9739, timezone: 5.5 },
  { id: "ujjain",     name: "Ujjain",     region: "Madhya Pradesh, India", latitude: 23.1793, longitude: 75.7849, timezone: 5.5 },
  { id: "tirupati",   name: "Tirupati",   region: "Andhra Pradesh, India", latitude: 13.6288, longitude: 79.4192, timezone: 5.5 },
  { id: "kathmandu",  name: "Kathmandu",  region: "Nepal",              latitude: 27.7172, longitude: 85.324,  timezone: 5.75 },
  { id: "colombo",    name: "Colombo",    region: "Sri Lanka",          latitude: 6.9271,  longitude: 79.8612, timezone: 5.5 },
  { id: "dubai",      name: "Dubai",      region: "UAE",                latitude: 25.2048, longitude: 55.2708, timezone: 4 },
  { id: "singapore",  name: "Singapore",  region: "Singapore",          latitude: 1.3521,  longitude: 103.8198, timezone: 8 },
  { id: "london",     name: "London",     region: "United Kingdom",     latitude: 51.5074, longitude: -0.1278, timezone: 0 },
  { id: "newyork",    name: "New York",   region: "United States",      latitude: 40.7128, longitude: -74.006, timezone: -5 },
  { id: "sanfrancisco", name: "San Francisco", region: "United States", latitude: 37.7749, longitude: -122.4194, timezone: -8 },
  { id: "sydney",     name: "Sydney",     region: "Australia",          latitude: -33.8688, longitude: 151.2093, timezone: 11 },
];

export const DEFAULT_PLACE = PLACES[0];

/** "19.076° N, 72.878° E" — the display form used everywhere coordinates appear. */
export function formatCoords(latitude: number, longitude: number) {
  const lat = `${Math.abs(latitude).toFixed(3)}° ${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(3)}° ${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}

/** "UTC+5:30" */
export function formatOffset(timezone: number) {
  const sign = timezone < 0 ? "-" : "+";
  const abs = Math.abs(timezone);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return `UTC${sign}${hours}:${String(minutes).padStart(2, "0")}`;
}
