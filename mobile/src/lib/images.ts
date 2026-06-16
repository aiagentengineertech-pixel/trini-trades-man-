// Image picking helper. Returns local URIs now; these get uploaded to Supabase
// Storage once the backend is connected.
import * as ImagePicker from 'expo-image-picker';

export async function pickImage(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
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
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

export async function pickImages(limit = 6): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsMultipleSelection: true,
    selectionLimit: limit,
  });
  if (res.canceled) return [];
  return res.assets.map((a) => a.uri);
}
