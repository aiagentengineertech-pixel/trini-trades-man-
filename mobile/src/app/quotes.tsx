import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

const TABS = ['Pending', 'Accepted', 'Rejected'] as const;
const STATUS_FOR: Record<string, 'pending' | 'accepted' | 'rejected'> = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
};

export default function QuotesScreen() {
  const { myQuotes } = useStore();
  const [tab, setTab] = useState<string>('Pending');
  const all = myQuotes();
  const list = all.filter((q) => q.bid.status === STATUS_FOR[tab]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Quotes</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Create actions */}
        <View style={styles.actions}>
          <Pressable style={styles.aiBtn} onPress={() => router.push('/ai-quote')}>
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text style={styles.aiText}>Invoice Generator</Text>
          </Pressable>
          <Pressable style={styles.actionMini} onPress={() => router.push('/ai-quote')}><Ionicons name="add" size={20} color={Brand.red} /></Pressable>
        </View>
        <Text style={styles.actionHint}>Your quotes are the bids you send on jobs. Generate a branded invoice once a quote is accepted.</Text>

        <View style={{ marginTop: 18 }}>
          <Segmented options={[...TABS]} value={tab} onChange={setTab} />
        </View>

        <View style={{ marginTop: 14, gap: 12 }}>
          {list.length === 0 && <Text style={styles.empty}>No {tab.toLowerCase()} quotes yet.</Text>}
          {list.map((q) => (
            <Pressable
              key={q.bid.id}
              onPress={() => q.job && router.push({ pathname: '/job/[id]', params: { id: q.job.id } })}>
              <Card style={styles.qCard}>
                <View style={styles.qTop}>
                  <View style={styles.grow}>
                    <Text style={styles.qJob}>{q.job?.title ?? 'Job'}</Text>
                    <Text style={styles.qCust}>{q.job ? `${q.job.trade} · ${q.job.area}` : '—'}{q.job?.createdAt ? ` · ${q.job.createdAt}` : ''}</Text>
                  </View>
                  <Text style={styles.qAmount}>TT${q.bid.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.qActions}>
                  <View style={[styles.qStatus, q.bid.status === 'accepted' && styles.qAccepted, q.bid.status === 'rejected' && styles.qRejected]}>
                    <Text style={[styles.qStatusText, q.bid.status !== 'pending' && { color: '#fff' }]}>
                      {q.bid.status === 'accepted' ? 'Accepted' : q.bid.status === 'rejected' ? 'Not selected' : 'Pending'}
                    </Text>
                  </View>
                  {q.bid.status === 'accepted' && (
                    <Pressable style={styles.qPdf} onPress={() => router.push('/ai-quote')}>
                      <Ionicons name="document-text-outline" size={15} color={Brand.body} />
                      <Text style={styles.qPdfText}>Invoice</Text>
                    </Pressable>
                  )}
                </View>
              </Card>
            </Pressable>
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

  actions: { flexDirection: 'row', gap: 10 },
  aiBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.ink, borderRadius: 14, paddingVertical: 14 },
  aiText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionMini: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  actionHint: { fontSize: 12, color: Brand.muted, marginTop: 10 },
  empty: { color: Brand.muted, textAlign: 'center', paddingVertical: 30 },

  qCard: { padding: 16 },
  qTop: { flexDirection: 'row', alignItems: 'flex-start' },
  grow: { flex: 1 },
  qJob: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  qCust: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  qAmount: { fontSize: 17, fontWeight: '800', color: Brand.red },
  qActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  qStatus: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9, backgroundColor: Brand.surfaceAlt },
  qAccepted: { backgroundColor: Brand.green },
  qRejected: { backgroundColor: Brand.muted },
  qStatusText: { fontSize: 12, fontWeight: '700', color: Brand.body },
  qPdf: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  qPdfText: { fontSize: 13, color: Brand.body, fontWeight: '600' },
});
