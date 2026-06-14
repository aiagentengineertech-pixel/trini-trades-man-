import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { Brand } from '@/constants/brand';

interface Req { id: string; name: string; trade: string; area: string; submitted: string; decision?: 'approved' | 'rejected'; }

const INITIAL: Req[] = [
  { id: '1', name: 'Sandy Electrical', trade: 'Electrician', area: 'Diego Martin', submitted: '2h ago' },
  { id: '2', name: 'Pro Plumb TT', trade: 'Plumbing', area: 'San Juan', submitted: '5h ago' },
  { id: '3', name: 'Island Masonry', trade: 'Masonry', area: 'Couva', submitted: '1d ago' },
  { id: '4', name: 'Cool Air Services', trade: 'AC Repair', area: 'Chaguanas', submitted: '1d ago' },
];

export default function VerificationsScreen() {
  const [reqs, setReqs] = useState<Req[]>(INITIAL);
  const decide = (id: string, decision: 'approved' | 'rejected') =>
    setReqs((p) => p.map((r) => (r.id === id ? { ...r, decision } : r)));

  const pending = reqs.filter((r) => !r.decision).length;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Verifications</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.count}>{pending} pending review</Text>
        {reqs.map((r) => (
          <Card key={r.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}><Ionicons name="business" size={22} color={Brand.muted} /></View>
              <View style={styles.flex}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={styles.meta}>{r.trade} · {r.area} · {r.submitted}</Text>
              </View>
            </View>

            <View style={styles.docs}>
              <View style={styles.doc}><Ionicons name="card" size={16} color={Brand.body} /><Text style={styles.docText}>Government ID</Text></View>
              <View style={styles.doc}><Ionicons name="person-circle" size={16} color={Brand.body} /><Text style={styles.docText}>Selfie</Text></View>
              <View style={styles.doc}><Ionicons name="document-text" size={16} color={Brand.body} /><Text style={styles.docText}>Insurance</Text></View>
            </View>

            {r.decision ? (
              <View style={[styles.resultTag, r.decision === 'approved' ? styles.approved : styles.rejected]}>
                <Ionicons name={r.decision === 'approved' ? 'checkmark-circle' : 'close-circle'} size={16} color="#fff" />
                <Text style={styles.resultText}>{r.decision === 'approved' ? 'Approved — Gold badge granted' : 'Rejected'}</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable style={styles.rejectBtn} onPress={() => decide(r.id, 'rejected')}>
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
                <Pressable style={styles.approveBtn} onPress={() => decide(r.id, 'approved')}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.approveText}>Approve</Text>
                </Pressable>
              </View>
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
  count: { fontSize: 13, color: Brand.muted, fontWeight: '600' },

  card: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  docs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  doc: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Brand.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  docText: { fontSize: 12, color: Brand.body, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  rejectBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Brand.line, alignItems: 'center' },
  rejectText: { color: Brand.body, fontWeight: '700', fontSize: 14 },
  approveBtn: { flex: 1.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Brand.green },
  approveText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  resultTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 11, borderRadius: 12 },
  approved: { backgroundColor: Brand.green },
  rejected: { backgroundColor: Brand.muted },
  resultText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
