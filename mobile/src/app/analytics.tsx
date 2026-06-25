import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle, StatCard } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { countProfileViews } from '@/lib/db';
import { useStore } from '@/lib/store';

export default function AnalyticsScreen() {
  const { userId } = useAuth();
  const { proSummary, conversations, jobs } = useStore();
  const s = proSummary();
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    if (userId) countProfileViews(userId).then(setViews);
  }, [userId]);

  // Real platform demand from open jobs.
  const open = jobs.filter((j) => j.status === 'open');
  const byTrade = tally(open.map((j) => j.trade));
  const byArea = tally(open.map((j) => j.area));
  const popular = top(byTrade, open.length, 4);
  const maxArea = Math.max(1, ...Object.values(byArea));
  const heat = Object.entries(byArea)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([area, n]) => ({ area, level: n / maxArea }));

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard value={views == null ? '—' : `${views}`} label="Profile Views" icon="eye" tint="#2F6FED" bg="#EAF1FE" />
          <StatCard value={`${s.quotesSent}`} label="Quotes Sent" icon="document-text" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard value={`${conversations.length}`} label="Conversations" icon="chatbubble-ellipses" tint="#16B1C9" bg="#E6F8FB" />
          <StatCard value={`${s.conversion}%`} label="Conversion" icon="trending-up" tint="#2EA84F" bg="#E9F8EE" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard value={`${s.won}`} label="Jobs Won" icon="trophy" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value={`${s.lost}`} label="Not Selected" icon="close-circle" tint="#8C1C2B" bg="#F6E7E9" />
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Most requested services (open jobs)" />
          <Card>
            {popular.length === 0 && <Text style={styles.empty}>No open jobs on the platform right now.</Text>}
            {popular.map((p, i) => (
              <View key={p.name} style={{ marginBottom: i < popular.length - 1 ? 14 : 0 }}>
                <View style={styles.popRow}>
                  <Text style={styles.popName}>{p.name}</Text>
                  <Text style={styles.popPct}>{p.pct}%</Text>
                </View>
                <View style={styles.popTrack}>
                  <View style={[styles.popFill, { width: `${p.pct}%` }]} />
                </View>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Demand across Trinidad & Tobago" />
          <Card>
            <Text style={styles.heatSub}>Where customers are posting jobs right now.</Text>
            {heat.length === 0 ? (
              <Text style={styles.empty}>No open jobs to map yet.</Text>
            ) : (
              <>
                <View style={styles.heatGrid}>
                  {heat.map((h) => (
                    <View key={h.area} style={[styles.heatTile, { backgroundColor: `rgba(225,29,38,${0.12 + h.level * 0.8})` }]}>
                      <Text style={[styles.heatArea, { color: h.level > 0.5 ? '#fff' : Brand.ink }]} numberOfLines={1}>{h.area}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.legend}>
                  <Text style={styles.legendText}>Low</Text>
                  <View style={styles.legendBar} />
                  <Text style={styles.legendText}>High</Text>
                </View>
              </>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function tally(items: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const it of items) m[it] = (m[it] ?? 0) + 1;
  return m;
}
function top(counts: Record<string, number>, total: number, n: number) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, c]) => ({ name, pct: total > 0 ? Math.round((c / total) * 100) : 0 }));
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  statsRow: { flexDirection: 'row', gap: 10 },
  empty: { color: Brand.muted, fontSize: 13, paddingVertical: 8 },

  popRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  popName: { fontSize: 14, color: Brand.ink, fontWeight: '600' },
  popPct: { fontSize: 14, color: Brand.red, fontWeight: '800' },
  popTrack: { height: 8, borderRadius: 4, backgroundColor: Brand.surfaceAlt, overflow: 'hidden' },
  popFill: { height: 8, borderRadius: 4, backgroundColor: Brand.red },

  heatSub: { fontSize: 13, color: Brand.muted, marginBottom: 14 },
  heatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heatTile: { width: '31%', flexGrow: 1, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 6 },
  heatArea: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  legendText: { fontSize: 11, color: Brand.muted },
  legendBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(225,29,38,0.5)' },
});
