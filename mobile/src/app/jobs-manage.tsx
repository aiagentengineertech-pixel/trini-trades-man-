import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented, type IconName } from '@/components/ui';
import { Brand } from '@/constants/brand';

type Tab = 'Active' | 'Upcoming' | 'Completed' | 'Disputed';
interface MJob { customer: string; job: string; value: string; location: string; timeline: string; icon: IconName; color: string; bg: string; }

const DATA: Record<Tab, MJob[]> = {
  Active: [
    { customer: 'Marcus R.', job: 'Rewire living room', value: 'TT$2,200', location: 'Maraval', timeline: 'In progress · day 2 of 3', icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
    { customer: 'Simone L.', job: 'Panel upgrade', value: 'TT$3,800', location: 'Westmoorings', timeline: 'Started today', icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
  ],
  Upcoming: [
    { customer: 'Aaliyah K.', job: 'Install 3 ceiling fans', value: 'TT$850', location: 'Diego Martin', timeline: 'Scheduled Thu, 9am', icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
  ],
  Completed: [
    { customer: 'Devon P.', job: 'Outdoor lighting', value: 'TT$1,400', location: 'St. Augustine', timeline: 'Completed Jun 9 · Paid', icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
    { customer: 'Keron J.', job: 'Socket replacement', value: 'TT$600', location: 'Chaguanas', timeline: 'Completed Jun 3 · Paid', icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
  ],
  Disputed: [
    { customer: 'Hassan M.', job: 'Breaker replacement', value: 'TT$400', location: 'Arima', timeline: 'Dispute opened Jun 11', icon: 'alert-circle', color: '#E8852B', bg: '#FDF1E6' },
  ],
};

export default function JobsManageScreen() {
  const [tab, setTab] = useState<Tab>('Active');
  const list = DATA[tab];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Job Management</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Segmented options={['Active', 'Upcoming', 'Completed', 'Disputed']} value={tab} onChange={(v) => setTab(v as Tab)} />
        <View style={{ marginTop: 14, gap: 12 }}>
          {list.map((j, i) => (
            <Card key={i} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.icon, { backgroundColor: j.bg }]}>
                  <Ionicons name={j.icon} size={22} color={j.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.job}>{j.job}</Text>
                  <Text style={styles.meta}>{j.customer} · {j.location}</Text>
                </View>
                <Text style={styles.value}>{j.value}</Text>
              </View>
              <View style={styles.timeline}>
                <Ionicons name={tab === 'Disputed' ? 'alert-circle' : 'time-outline'} size={14} color={tab === 'Disputed' ? Brand.star : Brand.muted} />
                <Text style={[styles.timelineText, tab === 'Disputed' && { color: Brand.star }]}>{j.timeline}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  card: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  job: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  value: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  timelineText: { fontSize: 12, color: Brand.muted, fontWeight: '600' },
});
