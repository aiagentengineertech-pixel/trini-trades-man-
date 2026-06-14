import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { Brand } from '@/constants/brand';

interface Dispute { id: string; job: string; customer: string; tradesman: string; amount: number; reason: string; resolution?: string; }

const INITIAL: Dispute[] = [
  { id: '1', job: 'Breaker replacement', customer: 'Hassan M.', tradesman: 'Sandy Electrical', amount: 400, reason: 'Customer says the breaker still trips after the repair.' },
  { id: '2', job: 'Wall plastering', customer: 'Simone L.', tradesman: 'Island Masonry', amount: 1500, reason: 'Job left incomplete, tradesman did not return.' },
];

export default function DisputesScreen() {
  const [items, setItems] = useState<Dispute[]>(INITIAL);
  const resolve = (id: string, resolution: string) => setItems((p) => p.map((d) => (d.id === id ? { ...d, resolution } : d)));

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Disputes</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }} showsVerticalScrollIndicator={false}>
        {items.map((d) => (
          <Card key={d.id} style={styles.card}>
            <View style={styles.head}>
              <View style={styles.warnIcon}><Ionicons name="alert-circle" size={20} color={Brand.star} /></View>
              <View style={styles.flex}>
                <Text style={styles.job}>{d.job}</Text>
                <Text style={styles.meta}>{d.customer} vs {d.tradesman} · TT${d.amount}</Text>
              </View>
            </View>
            <Text style={styles.reason}>“{d.reason}”</Text>

            {d.resolution ? (
              <View style={styles.resolvedTag}>
                <Ionicons name="checkmark-circle" size={16} color={Brand.green} />
                <Text style={styles.resolvedText}>{d.resolution}</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable style={styles.refundBtn} onPress={() => resolve(d.id, 'Resolved — refunded to customer')}>
                  <Text style={styles.refundText}>Refund customer</Text>
                </Pressable>
                <Pressable style={styles.releaseBtn} onPress={() => resolve(d.id, 'Resolved — released to tradesman')}>
                  <Text style={styles.releaseText}>Release to pro</Text>
                </Pressable>
              </View>
            )}
            {!d.resolution && (
              <Pressable style={styles.contactRow}>
                <Ionicons name="chatbubbles-outline" size={15} color={Brand.body} />
                <Text style={styles.contactText}>Message both parties</Text>
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

  card: { padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  warnIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FDF1E6', alignItems: 'center', justifyContent: 'center' },
  job: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  reason: { fontSize: 13, color: Brand.body, fontStyle: 'italic', marginTop: 12, lineHeight: 19 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  refundBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Brand.red, alignItems: 'center' },
  refundText: { color: Brand.red, fontWeight: '700', fontSize: 14 },
  releaseBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Brand.green, alignItems: 'center' },
  releaseText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  contactText: { color: Brand.body, fontSize: 13, fontWeight: '600' },

  resolvedTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: '#F1FBF5' },
  resolvedText: { color: Brand.green, fontWeight: '700', fontSize: 13 },
});
