// Optional device-location lookup. Returns the user's coordinates snapped to the
// nearest known T&T area, or null if permission is denied / unavailable.
import * as Location from 'expo-location';

import { nearestArea, type TTArea } from './locations';

export async function getCurrentArea(): Promise<{ area: TTArea; lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    return { area: nearestArea(coord), lat: coord.lat, lng: coord.lng };
  } catch {
    return null;
  }
}
