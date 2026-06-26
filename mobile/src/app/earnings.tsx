import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ambient, Card, SectionTitle, StatCard } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

export default function EarningsScreen() {
  const { proSummary, myQuotes } = useStore();
  const s = proSummary();
  const completed = myQuotes().filter((q) => q.bid.status === 'accepted' && q.job?.status === 'done');
  const active = myQuotes().filter((q) => q.bid.status === 'accepted' && q.job?.status === 'hired');

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>Total earned through Trini Side Hustle</Text>
          <Text style={styles.heroValue}>TT${s.totalEarned.toLocaleString()}</Text>
          <View style={styles.heroTrend}>
            <Ionicons name="checkmark-done" size={14} color="#fff" />
            <Text style={styles.heroTrendText}>{s.completedJobs} job{s.completedJobs === 1 ? '' : 's'} completed</Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <StatCard value={`TT$${s.released.toLocaleString()}`} label="Released" icon="checkmark-done" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value={`TT$${s.escrowHeld.toLocaleString()}`} label="In Escrow" icon="lock-closed" tint="#E8852B" bg="#FDF1E6" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard value={`TT$${s.avgJobValue.toLocaleString()}`} label="Avg Job Value" icon="pricetag" tint="#2F6FED" bg="#EAF1FE" />
          <StatCard value={`${s.won}`} label="Jobs Won" icon="trophy" tint="#2EA84F" bg="#E9F8EE" />
        </View>

        {active.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <SectionTitle title="In escrow (in progress)" />
            <Card style={{ paddingVertical: 4 }}>
              {active.map((q, i) => (
                <View key={q.bid.id} style={[styles.row, i < active.length - 1 && styles.divider]}>
                  <Ionicons name="lock-closed" size={18} color={Brand.star} />
                  <View style={styles.grow}>
                    <Text style={styles.rowJob}>{q.job?.title}</Text>
                    <Text style={styles.rowMeta}>{q.job?.area}</Text>
                  </View>
                  <Text style={styles.rowAmt}>TT${q.bid.amount.toLocaleString()}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Completed & paid" />
          <Card style={{ paddingVertical: 4 }}>
            {completed.length === 0 && <Text style={styles.empty}>No completed jobs yet. Payments show here once a customer confirms a job is done.</Text>}
            {completed.map((q, i) => (
              <View key={q.bid.id} style={[styles.row, i < completed.length - 1 && styles.divider]}>
                <Ionicons name="checkmark-done" size={18} color={Brand.green} />
                <View style={styles.grow}>
                  <Text style={styles.rowJob}>{q.job?.title}</Text>
                  <Text style={styles.rowMeta}>{q.job?.area} · {q.job?.createdAt}</Text>
                </View>
                <Text style={[styles.rowAmt, { color: Brand.green }]}>+TT${q.bid.amount.toLocaleString()}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  hero: { backgroundColor: Brand.red, borderColor: Brand.red, alignItems: 'flex-start' },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  heroValue: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: -1 },
  heroTrend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  heroTrendText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  grow: { flex: 1 },
  rowJob: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  rowMeta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  rowAmt: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  empty: { color: Brand.muted, paddingVertical: 16, lineHeight: 20, fontSize: 13 },
});
