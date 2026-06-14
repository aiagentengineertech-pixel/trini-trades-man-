import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle, StatCard, type IconName } from '@/components/ui';
import { Brand } from '@/constants/brand';

const SECTIONS: { icon: IconName; label: string; desc: string; count: number; route: Href; tint: string; bg: string }[] = [
  { icon: 'shield-checkmark-outline', label: 'Verifications', desc: 'Approve tradesman IDs', count: 4, route: '/admin/verifications', tint: '#2EA84F', bg: '#E9F8EE' },
  { icon: 'cash-outline', label: 'Payouts', desc: 'Release escrow funds', count: 3, route: '/admin/payouts', tint: '#E11D26', bg: '#FDECEC' },
  { icon: 'alert-circle-outline', label: 'Disputes', desc: 'Resolve open cases', count: 2, route: '/admin/disputes', tint: '#E8852B', bg: '#FDF1E6' },
  { icon: 'people-outline', label: 'Users', desc: 'Manage accounts', count: 1284, route: '/admin/verifications', tint: '#2F6FED', bg: '#EAF1FE' },
];

export default function AdminHome() {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Admin Console</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>Platform volume this month</Text>
          <Text style={styles.heroValue}>TT$184,500</Text>
          <Text style={styles.heroSub}>Your 10% commission: TT$18,450</Text>
        </Card>

        <View style={[styles.statsRow, { marginTop: 16 }]}>
          <StatCard value="1,284" label="Users" icon="people" tint="#2F6FED" bg="#EAF1FE" />
          <StatCard value="86" label="Active Jobs" icon="briefcase" />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }]}>
          <StatCard value="4" label="Pending IDs" icon="shield-checkmark" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value="2" label="Disputes" icon="alert-circle" tint="#E8852B" bg="#FDF1E6" />
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Operations" />
          <View style={{ gap: 12 }}>
            {SECTIONS.map((s) => (
              <Pressable key={s.label} onPress={() => router.push(s.route)}>
                <Card style={styles.opCard}>
                  <View style={[styles.opIcon, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={22} color={s.tint} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.opLabel}>{s.label}</Text>
                    <Text style={styles.opDesc}>{s.desc}</Text>
                  </View>
                  {s.count > 0 && s.count < 100 && (
                    <View style={styles.opBadge}><Text style={styles.opBadgeText}>{s.count}</Text></View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  hero: { backgroundColor: Brand.ink, borderColor: Brand.ink },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  heroValue: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  heroSub: { color: '#7FD49B', fontSize: 13, fontWeight: '600', marginTop: 6 },

  statsRow: { flexDirection: 'row', gap: 10 },

  opCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  opIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  opLabel: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  opDesc: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  opBadge: { backgroundColor: Brand.red, minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  opBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
