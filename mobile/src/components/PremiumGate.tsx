// Premium gating: a hook to read subscription status and a full-screen lock
// for premium-only screens (Phase 2 invoice tools, etc).
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

export function usePremium(): boolean {
  return !!useStore().myProfile?.isPremium;
}

export function PremiumGateScreen({ title, feature }: { title: string; feature: string }) {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={styles.body}>
        <View style={styles.icon}><Ionicons name="lock-closed" size={28} color={Brand.red} /></View>
        <Text style={styles.h}>A Premium feature</Text>
        <Text style={styles.sub}>{feature} is part of the Trini Tradesman Premium plan.</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/upgrade')}>
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={styles.btnText}>See Premium</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Brand.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  h: { fontSize: 20, fontWeight: '800', color: Brand.ink },
  sub: { fontSize: 14, color: Brand.muted, textAlign: 'center', lineHeight: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.red, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 18 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
