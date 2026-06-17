// Image picking helper. Returns local URIs now; these get uploaded to Supabase
// Storage once the backend is connected.
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// On web the browser file dialog needs no permission; requesting one can resolve
// to "not granted" and silently block the picker. Skip the gate on web.
const canUseLibrary = async () =>
  Platform.OS === 'web' || (await ImagePicker.requestMediaLibraryPermissionsAsync()).granted;
const canUseCamera = async () =>
  Platform.OS === 'web' || (await ImagePicker.requestCameraPermissionsAsync()).granted;

export async function pickImage(): Promise<string | null> {
  if (!(await canUseLibrary())) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
  });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

/** Snap a photo with the camera (e.g. a receipt). Falls back to null if denied. */
export async function takePhoto(): Promise<string | null> {
  if (!(await canUseCamera())) return null;
  const res = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

export async function pickImages(limit = 6): Promise<string[]> {
  if (!(await canUseLibrary())) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsMultipleSelection: true,
    selectionLimit: limit,
  });
  if (res.canceled) return [];
  return res.assets.map((a) => a.uri);
}
