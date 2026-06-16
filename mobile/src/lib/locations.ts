// Trinidad & Tobago areas with representative coordinates, plus distance helpers.
// Used so every profile and job has real lat/lng (for "near you" distance and
// service-area coverage) without forcing GPS — the user can pick their town,
// or optionally use their device location which snaps to the nearest area.

export interface TTArea {
  name: string;
  lat: number;
  lng: number;
  region: 'Trinidad' | 'Tobago';
}

export const TT_AREAS: TTArea[] = [
  { name: 'Port of Spain', lat: 10.6549, lng: -61.5019, region: 'Trinidad' },
  { name: 'San Fernando', lat: 10.2797, lng: -61.4663, region: 'Trinidad' },
  { name: 'Chaguanas', lat: 10.5167, lng: -61.4111, region: 'Trinidad' },
  { name: 'Arima', lat: 10.6375, lng: -61.2825, region: 'Trinidad' },
  { name: 'Point Fortin', lat: 10.174, lng: -61.6843, region: 'Trinidad' },
  { name: 'Couva', lat: 10.4236, lng: -61.4364, region: 'Trinidad' },
  { name: 'Diego Martin', lat: 10.7167, lng: -61.5667, region: 'Trinidad' },
  { name: 'Tunapuna', lat: 10.65, lng: -61.3833, region: 'Trinidad' },
  { name: 'San Juan', lat: 10.65, lng: -61.45, region: 'Trinidad' },
  { name: 'Sangre Grande', lat: 10.5856, lng: -61.13, region: 'Trinidad' },
  { name: 'Princes Town', lat: 10.2667, lng: -61.3833, region: 'Trinidad' },
  { name: 'Penal', lat: 10.1667, lng: -61.4667, region: 'Trinidad' },
  { name: 'Siparia', lat: 10.1453, lng: -61.5072, region: 'Trinidad' },
  { name: 'Rio Claro', lat: 10.305, lng: -61.175, region: 'Trinidad' },
  { name: 'Marabella', lat: 10.3, lng: -61.45, region: 'Trinidad' },
  { name: 'Gasparillo', lat: 10.3167, lng: -61.4333, region: 'Trinidad' },
  { name: 'Maraval', lat: 10.6833, lng: -61.5167, region: 'Trinidad' },
  { name: 'Carenage', lat: 10.6833, lng: -61.6, region: 'Trinidad' },
  { name: 'Cunupia', lat: 10.5333, lng: -61.3833, region: 'Trinidad' },
  { name: 'Freeport', lat: 10.45, lng: -61.4167, region: 'Trinidad' },
  { name: 'La Romaine', lat: 10.2667, lng: -61.4667, region: 'Trinidad' },
  { name: 'Tabaquite', lat: 10.3833, lng: -61.3, region: 'Trinidad' },
  { name: 'Valencia', lat: 10.65, lng: -61.2, region: 'Trinidad' },
  { name: 'Chaguaramas', lat: 10.6833, lng: -61.6333, region: 'Trinidad' },
  { name: 'Mayaro', lat: 10.2833, lng: -61.0167, region: 'Trinidad' },
  { name: 'Toco', lat: 10.8333, lng: -60.95, region: 'Trinidad' },
  { name: 'Scarborough', lat: 11.1817, lng: -60.737, region: 'Tobago' },
  { name: 'Roxborough', lat: 11.25, lng: -60.5833, region: 'Tobago' },
  { name: 'Crown Point', lat: 11.1497, lng: -60.8378, region: 'Tobago' },
];

export function findArea(name?: string | null): TTArea | undefined {
  if (!name) return undefined;
  return TT_AREAS.find((a) => a.name.toLowerCase() === name.toLowerCase());
}

const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km between two coordinates. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** The closest known area to a raw coordinate (used to label a GPS fix). */
export function nearestArea(coord: { lat: number; lng: number }): TTArea {
  let best = TT_AREAS[0];
  let bestD = Infinity;
  for (const a of TT_AREAS) {
    const d = haversineKm(coord, a);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

/** Human-friendly distance label, e.g. "750 m away" / "3.2 km away". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}
