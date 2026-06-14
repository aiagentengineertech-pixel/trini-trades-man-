import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle, StatCard } from '@/components/ui';
import { Brand } from '@/constants/brand';

const POPULAR = [
  { name: 'Panel upgrades', pct: 41 },
  { name: 'Wiring & rewiring', pct: 28 },
  { name: 'Lighting installation', pct: 19 },
  { name: 'Emergency repairs', pct: 12 },
];

const HEAT = [
  { area: 'Port of Spain', level: 0.95 }, { area: 'San Juan', level: 0.7 }, { area: 'Diego Martin', level: 0.8 },
  { area: 'Chaguanas', level: 0.6 }, { area: 'Arima', level: 0.45 }, { area: 'San Fernando', level: 0.55 },
  { area: 'Couva', level: 0.3 }, { area: 'Tunapuna', level: 0.5 }, { area: 'Point Fortin', level: 0.2 },
];

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard value="1,284" label="Profile Views" icon="eye" tint="#2F6FED" bg="#EAF1FE" />
          <StatCard value="86" label="Quote Requests" icon="document-text" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard value="142" label="Messages" icon="chatbubble-ellipses" tint="#16B1C9" bg="#E6F8FB" />
          <StatCard value="58%" label="Conversion" icon="trending-up" tint="#2EA84F" bg="#E9F8EE" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard value="50" label="Jobs Won" icon="trophy" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value="36" label="Jobs Lost" icon="close-circle" tint="#E11D26" bg="#FDECEC" />
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Most popular services" />
          <Card>
            {POPULAR.map((p, i) => (
              <View key={p.name} style={{ marginBottom: i < POPULAR.length - 1 ? 14 : 0 }}>
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
          <SectionTitle title="Demand across Trinidad" />
          <Card>
            <Text style={styles.heatSub}>Where customers are requesting your trade most.</Text>
            <View style={styles.heatGrid}>
              {HEAT.map((h) => (
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
  statsRow: { flexDirection: 'row', gap: 10 },

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
