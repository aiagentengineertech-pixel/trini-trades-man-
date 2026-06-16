import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

const TABS = ['Active', 'Pending', 'Completed'] as const;
type Tab = (typeof TABS)[number];

export default function JobsManageScreen() {
  const { myQuotes } = useStore();
  const [tab, setTab] = useState<Tab>('Active');
  const all = myQuotes();

  const list = all.filter((q) => {
    if (tab === 'Active') return q.bid.status === 'accepted' && q.job?.status === 'hired';
    if (tab === 'Completed') return q.bid.status === 'accepted' && q.job?.status === 'done';
    return q.bid.status === 'pending'; // Pending = quotes you're waiting on
  });

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Job Management</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Segmented options={[...TABS]} value={tab} onChange={(v) => setTab(v as Tab)} />
        <View style={{ marginTop: 14, gap: 12 }}>
          {list.length === 0 && (
            <Text style={styles.empty}>
              {tab === 'Active' ? 'No active jobs. Accepted quotes appear here.' : tab === 'Completed' ? 'No completed jobs yet.' : 'No pending quotes.'}
            </Text>
          )}
          {list.map((q) => {
            const j = q.job;
            if (!j) return null;
            const timeline =
              tab === 'Active' ? 'In progress · awaiting customer confirmation'
              : tab === 'Completed' ? 'Completed · paid from escrow'
              : 'Quote sent · awaiting customer';
            return (
              <Pressable key={q.bid.id} onPress={() => router.push({ pathname: '/job/[id]', params: { id: j.id } })}>
                <Card style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.icon, { backgroundColor: j.bg }]}>
                      <Ionicons name={j.icon} size={22} color={j.color} />
                    </View>
                    <View style={styles.grow}>
                      <Text style={styles.job}>{j.title}</Text>
                      <Text style={styles.meta}>{j.trade} · {j.area}</Text>
                    </View>
                    <Text style={styles.value}>TT${q.bid.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.timeline}>
                    <Ionicons name={tab === 'Completed' ? 'checkmark-done' : 'time-outline'} size={14} color={tab === 'Completed' ? Brand.green : Brand.muted} />
                    <Text style={[styles.timelineText, tab === 'Completed' && { color: Brand.green }]}>{timeline}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  empty: { color: Brand.muted, textAlign: 'center', paddingVertical: 30, lineHeight: 20 },

  card: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  job: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  value: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  timelineText: { fontSize: 12, color: Brand.muted, fontWeight: '600' },
});
