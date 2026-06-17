import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';

export default function TabsLayout() {
  const { loading, signedIn, role } = useAuth();
  const insets = useSafeAreaInsets();

  if (!loading && !signedIn) return <Redirect href="/login" />;

  const isTradesman = role === 'tradesman';
  const bottomInset = insets.bottom; // home indicator / rounded-corner safe area

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.red,
        tabBarInactiveTintColor: '#9AA0A6',
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(0,0,0,0.08)',
          height: 56 + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarBackground: () => <Glass intensity={60} style={StyleSheet.absoluteFillObject} />,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: isTradesman ? 'Dashboard' : 'Post Job',
          tabBarIcon: ({ color, size }) =>
            isTradesman ? (
              <Ionicons name="grid-outline" size={size} color={color} />
            ) : (
              <Ionicons name="add-circle" size={size + 6} color={Brand.red} style={{ marginTop: -2 }} />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
