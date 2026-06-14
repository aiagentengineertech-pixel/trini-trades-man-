import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { Brand } from '@/constants/brand';

interface Payout { id: string; job: string; tradesman: string; customer: string; amount: number; commission: number; released?: boolean; }

const INITIAL: Payout[] = [
  { id: '1', job: 'Kitchen rewire', tradesman: "John's Electrical", customer: 'Marcus R.', amount: 6500, commission: 650 },
  { id: '2', job: 'Bathroom plumbing', tradesman: 'Flow Right Plumbing', customer: 'Nadia S.', amount: 2200, commission: 220 },
  { id: '3', job: 'AC install', tradesman: 'Cool Breeze AC', customer: 'Keron J.', amount: 1800, commission: 180 },
];

export default function PayoutsScreen() {
  const [items, setItems] = useState<Payout[]>(INITIAL);
  const release = (id: string) => setItems((p) => p.map((x) => (x.id === id ? { ...x, released: true } : x)));
  const held = items.filter((x) => !x.released).reduce((s, x) => s + x.amount, 0);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Payouts</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>Held in escrow</Text>
          <Text style={styles.heroValue}>TT${held.toLocaleString()}</Text>
          <Text style={styles.heroSub}>Release once a customer confirms the job is done.</Text>
        </Card>

        {items.map((p) => (
          <Card key={p.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.job}>{p.job}</Text>
                <Text style={styles.meta}>{p.tradesman} ← {p.customer}</Text>
              </View>
              <Text style={styles.amount}>TT${p.amount.toLocaleString()}</Text>
            </View>
            <Text style={styles.commission}>Platform commission: TT${p.commission} · Pro receives TT${(p.amount - p.commission).toLocaleString()}</Text>
            {p.released ? (
              <View style={styles.releasedTag}>
                <Ionicons name="checkmark-circle" size={16} color={Brand.green} />
                <Text style={styles.releasedText}>Released to tradesman</Text>
              </View>
            ) : (
              <Pressable style={styles.releaseBtn} onPress={() => release(p.id)}>
                <Ionicons name="lock-open-outline" size={16} color="#fff" />
                <Text style={styles.releaseText}>Release payout</Text>
              </Pressable>
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  hero: { backgroundColor: Brand.red, borderColor: Brand.red },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 6 },

  card: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  job: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  amount: { fontSize: 17, fontWeight: '800', color: Brand.ink },
  commission: { fontSize: 12, color: Brand.muted, marginTop: 10 },
  releaseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Brand.red, borderRadius: 12, paddingVertical: 12, marginTop: 14 },
  releaseText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  releasedTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: '#F1FBF5' },
  releasedText: { color: Brand.green, fontWeight: '700', fontSize: 13 },
});
