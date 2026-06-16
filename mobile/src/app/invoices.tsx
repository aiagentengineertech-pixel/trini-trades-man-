import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { PremiumGateScreen, usePremium } from '@/components/PremiumGate';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchInvoices, fetchInvoiceSettings, fetchInvoiceWithItems, type SavedInvoice } from '@/lib/db';
import { generateInvoicePdf } from '@/lib/invoice';

export default function InvoicesScreen() {
  const { userId } = useAuth();
  const premium = usePremium();
  const [items, setItems] = useState<SavedInvoice[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => { if (userId) setItems(await fetchInvoices(userId)); }, [userId]);
  useEffect(() => { load(); }, [load]);

  const reSend = async (id: string) => {
    if (!userId) return;
    setBusyId(id);
    try {
      const [settings, inv] = await Promise.all([fetchInvoiceSettings(userId), fetchInvoiceWithItems(id)]);
      if (!inv) return;
      const eff = settings ?? { businessName: '', logoUrl: null, brandColor: '#E11D26', taxId: '', paymentTerms: '', footerNote: '', contactPhone: '', contactEmail: '' };
      await generateInvoicePdf(eff, { number: inv.number, date: '', customerName: inv.customerName, lines: inv.lines, taxPct: inv.taxPct, notes: inv.notes });
    } finally { setBusyId(null); }
  };

  if (!premium) return <PremiumGateScreen title="Invoices" feature="Saved invoice history" />;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Invoice History</Text>
        <Pressable onPress={() => router.push('/ai-quote')} hitSlop={10}><Ionicons name="add" size={26} color={Brand.red} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={32} color={Brand.muted} />
            <Text style={styles.emptyText}>No invoices yet.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/ai-quote')}><Text style={styles.emptyBtnText}>Create an invoice</Text></Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((iv) => (
              <Card key={iv.id} style={styles.row}>
                <View style={styles.icon}><Ionicons name="document-text" size={18} color={Brand.red} /></View>
                <View style={styles.grow}>
                  <Text style={styles.num}>{iv.customerName}</Text>
                  <Text style={styles.meta}>{iv.number} · {iv.createdAt}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.total}>TT${iv.total.toLocaleString()}</Text>
                  <Pressable style={styles.pdfBtn} onPress={() => reSend(iv.id)} disabled={busyId === iv.id}>
                    <Ionicons name="download-outline" size={14} color={Brand.red} />
                    <Text style={styles.pdfText}>{busyId === iv.id ? '…' : 'PDF'}</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  grow: { flex: 1 },

  empty: { alignItems: 'center', gap: 12, paddingVertical: 50 },
  emptyText: { fontSize: 14, color: Brand.muted },
  emptyBtn: { backgroundColor: Brand.red, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Brand.redSoft, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  total: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.line, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  pdfText: { color: Brand.red, fontWeight: '700', fontSize: 12 },
});
