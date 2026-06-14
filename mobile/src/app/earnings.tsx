import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle, StatCard } from '@/components/ui';
import { Brand } from '@/constants/brand';

const MONTHS = [
  { m: 'Jan', v: 2800 }, { m: 'Feb', v: 3200 }, { m: 'Mar', v: 2400 },
  { m: 'Apr', v: 3900 }, { m: 'May', v: 3600 }, { m: 'Jun', v: 4250 },
];
const MAX = Math.max(...MONTHS.map((x) => x.v));

export default function EarningsScreen() {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>This month</Text>
          <Text style={styles.heroValue}>TT$4,250</Text>
          <View style={styles.heroTrend}>
            <Ionicons name="trending-up" size={14} color="#fff" />
            <Text style={styles.heroTrendText}>+18% vs last month</Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <StatCard value="TT$3.6k" label="Last Month" icon="calendar" />
          <StatCard value="TT$1.8k" label="Pending Escrow" icon="lock-closed" tint="#E8852B" bg="#FDF1E6" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard value="TT$18.4k" label="Released (YTD)" icon="checkmark-done" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value="TT$680" label="Avg Job Value" icon="pricetag" tint="#2F6FED" bg="#EAF1FE" />
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Revenue — last 6 months" />
          <Card>
            <View style={styles.chart}>
              {MONTHS.map((x) => (
                <View key={x.m} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: `${(x.v / MAX) * 100}%`, backgroundColor: x.m === 'Jun' ? Brand.red : '#F3C2C4' }]} />
                  </View>
                  <Text style={styles.barLabel}>{x.m}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Most requested service" />
          <Card style={styles.reqCard}>
            <View style={styles.reqIcon}><Ionicons name="flash" size={22} color="#E11D26" /></View>
            <View style={styles.flex}>
              <Text style={styles.reqName}>Panel upgrades</Text>
              <Text style={styles.reqMeta}>32 jobs · TT$9,800 earned</Text>
            </View>
            <Text style={styles.reqPct}>41%</Text>
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

  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 150, gap: 8 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  bar: { width: '70%', alignSelf: 'center', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, color: Brand.muted, marginTop: 8 },

  reqCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reqIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center' },
  reqName: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  reqMeta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  reqPct: { fontSize: 20, fontWeight: '800', color: Brand.red },
});
