import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';

// Entry route for "/". Sends you to the app if signed in, otherwise to login.
export default function Index() {
  const { loading, signedIn } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={Brand.red} size="large" />
      </View>
    );
  }

  return <Redirect href={signedIn ? '/home' : '/login'} />;
}
