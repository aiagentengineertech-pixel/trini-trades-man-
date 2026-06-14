// Local notifications now; remote push (when the app is closed) plugs in at the
// native-build step via Expo Push + a Supabase trigger.
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

export async function notifyLocal(title: string, body: string): Promise<void> {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {
    // no-op on platforms where local notifications aren't available (e.g. web)
  }
}
