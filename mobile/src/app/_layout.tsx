import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth';
import { StoreProvider } from '@/lib/store';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
