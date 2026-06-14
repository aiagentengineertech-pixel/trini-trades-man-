import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented } from '@/components/ui';
import { Brand } from '@/constants/brand';

interface Quote { customer: string; job: string; amount: string; date: string; status: 'Pending' | 'Accepted' | 'Rejected'; }

const QUOTES: Quote[] = [
  { customer: 'Aaliyah K.', job: 'Install 3 ceiling fans', amount: 'TT$850', date: 'Jun 13', status: 'Pending' },
  { customer: 'Marcus R.', job: 'Rewire living room', amount: 'TT$2,200', date: 'Jun 12', status: 'Accepted' },
  { customer: 'Devon P.', job: 'Outdoor lighting', amount: 'TT$1,400', date: 'Jun 9', status: 'Pending' },
  { customer: 'Simone L.', job: 'Panel upgrade', amount: 'TT$3,800', date: 'Jun 2', status: 'Accepted' },
  { customer: 'Keron J.', job: 'Generator install', amount: 'TT$5,500', date: 'May 28', status: 'Rejected' },
];

export default function QuotesScreen() {
  const [tab, setTab] = useState('Pending');
  const list = QUOTES.filter((q) => q.status === tab);

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
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.aiText}>AI Quote Generator</Text>
          </Pressable>
          <Pressable style={styles.actionMini} onPress={() => router.push('/ai-quote')}><Ionicons name="add" size={20} color={Brand.red} /></Pressable>
          <Pressable style={styles.actionMini}><Ionicons name="documents-outline" size={18} color={Brand.red} /></Pressable>
        </View>
        <Text style={styles.actionHint}>Create a quote, use a saved template, or export to PDF.</Text>

        <View style={{ marginTop: 18 }}>
          <Segmented options={['Pending', 'Accepted', 'Rejected']} value={tab} onChange={setTab} />
        </View>

        <View style={{ marginTop: 14, gap: 12 }}>
          {list.length === 0 && <Text style={styles.empty}>No {tab.toLowerCase()} quotes.</Text>}
          {list.map((q, i) => (
            <Card key={i} style={styles.qCard}>
              <View style={styles.qTop}>
                <View style={styles.flex}>
                  <Text style={styles.qJob}>{q.job}</Text>
                  <Text style={styles.qCust}>{q.customer} · {q.date}</Text>
                </View>
                <Text style={styles.qAmount}>{q.amount}</Text>
              </View>
              <View style={styles.qActions}>
                <View style={[styles.qStatus, q.status === 'Accepted' && styles.qAccepted, q.status === 'Rejected' && styles.qRejected]}>
                  <Text style={[styles.qStatusText, q.status !== 'Pending' && { color: '#fff' }]}>{q.status}</Text>
                </View>
                <Pressable style={styles.qPdf}>
                  <Ionicons name="download-outline" size={15} color={Brand.body} />
                  <Text style={styles.qPdfText}>PDF</Text>
                </Pressable>
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

  actions: { flexDirection: 'row', gap: 10 },
  aiBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.ink, borderRadius: 14, paddingVertical: 14 },
  aiText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionMini: { width: 50, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  actionHint: { fontSize: 12, color: Brand.muted, marginTop: 10 },
  empty: { color: Brand.muted, textAlign: 'center', paddingVertical: 30 },

  qCard: { padding: 16 },
  qTop: { flexDirection: 'row', alignItems: 'flex-start' },
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
