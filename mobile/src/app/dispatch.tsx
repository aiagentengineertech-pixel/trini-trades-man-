import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Ambient, Card } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchOwnerAssignments, type Assignment } from '@/lib/db';
import { useStore } from '@/lib/store';

function dayKey(iso: string | null): string {
  if (!iso) return 'Unscheduled';
  const d = new Date(iso); const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return 'This week';
  return 'Later';
}
const ORDER = ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later', 'Unscheduled'];

export default function DispatchScreen() {
  const { userId } = useAuth();
  const premium = usePremium();
  const dispatchOn = useFeature('dispatch');
  const { getJob } = useStore();
  const [items, setItems] = useState<Assignment[]>([]);

  const load = useCallback(async () => { if (userId) setItems(await fetchOwnerAssignments(userId)); }, [userId]);
  useEffect(() => { load(); }, [load]);

  if (!premium) return <PremiumGateScreen title="Dispatch" feature="Employee dispatch & scheduling" />;
  if (!dispatchOn) return <FeatureGateScreen title="Dispatch" feature="Dispatch & scheduling" />;

  const groups: Record<string, Assignment[]> = {};
  items.forEach((a) => { const k = dayKey(a.scheduledAt); (groups[k] ??= []).push(a); });

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Dispatch</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.hint}>Jobs assigned to your team. Set a time on a job to dispatch it — your employee gets notified.</Text>
        {items.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={32} color={Brand.muted} />
            <Text style={styles.emptyText}>Nothing dispatched yet. Open a hired job and assign it to an employee.</Text>
          </View>
        )}
        {ORDER.filter((k) => groups[k]?.length).map((k) => (
          <View key={k} style={{ marginTop: 18 }}>
            <Text style={[styles.dayTitle, k === 'Overdue' && { color: Brand.red }]}>{k}</Text>
            <View style={{ gap: 10 }}>
              {groups[k].map((a) => {
                const job = getJob(a.jobId);
                return (
                  <Pressable key={a.id} onPress={() => router.push({ pathname: '/job/[id]', params: { id: a.jobId } })}>
                    <Card style={styles.row}>
                      <View style={[styles.icon, job ? { backgroundColor: job.bg } : null]}>
                        <Ionicons name={job?.icon ?? 'briefcase'} size={20} color={job?.color ?? Brand.body} />
                      </View>
                      <View style={styles.grow}>
                        <Text style={styles.job}>{job?.title ?? 'Job'}</Text>
                        <Text style={styles.meta}>{a.employeeName || 'Employee'}{job?.area ? ` · ${job.area}` : ''}</Text>
                        {!!a.note && <Text style={styles.note}>“{a.note}”</Text>}
                      </View>
                      {a.scheduledAt && (
                        <Text style={styles.time}>{new Date(a.scheduledAt).toLocaleString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  grow: { flex: 1 },
  hint: { fontSize: 13, color: Brand.muted, lineHeight: 19 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyText: { fontSize: 14, color: Brand.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  dayTitle: { fontSize: 14, fontWeight: '800', color: Brand.ink, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  job: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  note: { fontSize: 12, color: Brand.body, marginTop: 3, fontStyle: 'italic' },
  time: { fontSize: 13, fontWeight: '800', color: Brand.red },
});
