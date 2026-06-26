import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Ambient, Card } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { convertToInvoice, fetchClient, fetchInvoiceSettings, fetchInvoiceWithItems, markInvoicePaid, notifyUser, signOffDocument } from '@/lib/db';
import { generateInvoicePdf, invoiceTotals } from '@/lib/invoice';
import type { Client, InvoiceSettings } from '@/lib/store-types';

const LABEL: Record<string, string> = { invoice: 'Invoice', bill: 'Bill', estimate: 'Estimate', quote: 'Quote' };
const money = (n: number) => `TT$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DocDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const premium = usePremium();
  const invoicesOn = useFeature('invoices');
  const [doc, setDoc] = useState<Awaited<ReturnType<typeof fetchInvoiceWithItems>>>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [signName, setSignName] = useState('');
  const [busy, setBusy] = useState(false);
  const [reminded, setReminded] = useState(false);

  const load = useCallback(async () => {
    const d = await fetchInvoiceWithItems(id);
    setDoc(d);
    if (userId) setSettings(await fetchInvoiceSettings(userId));
    if (d?.clientId) setClient(await fetchClient(d.clientId));
  }, [id, userId]);
  useEffect(() => { load(); }, [load]);

  if (!premium) return <PremiumGateScreen title="Document" feature="Documents & estimates" />;
  if (!invoicesOn) return <FeatureGateScreen title="Document" feature="Invoicing" />;
  if (!doc) return <SafeAreaView style={styles.flex}>
      <Ambient /><Text style={{ padding: 24 }}>Document not found.</Text></SafeAreaView>;

  const totals = invoiceTotals({ number: doc.number, date: '', customerName: doc.customerName, lines: doc.lines, taxPct: doc.taxPct });
  const isEstimate = doc.docType === 'estimate' || doc.docType === 'quote';
  const approved = !!doc.signedAt;
  const converted = !!doc.convertedTo;

  const downloadPdf = async () => {
    const eff = settings ?? { businessName: '', logoUrl: null, brandColor: '#8C1C2B', taxId: '', paymentTerms: '', footerNote: '', contactPhone: '', contactEmail: '' };
    setBusy(true);
    try {
      await generateInvoicePdf(eff, {
        docType: doc.docType, number: doc.number, date: new Date().toLocaleDateString(), customerName: doc.customerName,
        lines: doc.lines, taxPct: doc.taxPct, notes: doc.notes,
        signedName: doc.signedName, signedDate: doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : null,
      });
    } finally { setBusy(false); }
  };

  const approve = async () => {
    if (!signName.trim()) return;
    setBusy(true);
    await signOffDocument(id, signName.trim());
    setBusy(false);
    setSignName('');
    load();
  };

  const convert = async () => {
    if (!userId) return;
    setBusy(true);
    const newId = await convertToInvoice(userId, id);
    setBusy(false);
    if (newId) router.replace({ pathname: '/doc/[id]', params: { id: newId } });
  };

  const markPaid = async () => { setBusy(true); await markInvoicePaid(id); setBusy(false); load(); };

  const sendReminder = () => {
    const biz = settings?.businessName || 'Trini Side Hustle';
    const subject = `Payment reminder — ${doc!.number}`;
    const body = `Hi ${doc!.customerName || 'there'},\n\nThis is a friendly reminder that ${doc!.number} for ${money(totals.total)} is now due.\n\nYou can pay by bank transfer or WiPay. Please let me know once settled, and thank you for your business.\n\n${biz}`;
    Linking.openURL(`mailto:${client?.email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`).catch(() => {});
    if (userId) notifyUser(userId, 'reminder', 'Payment reminder sent', `${doc!.number} · ${doc!.customerName || 'client'} · ${money(totals.total)}`, null);
    setReminded(true);
  };

  const isBillable = doc.docType === 'invoice' || doc.docType === 'bill';
  const paid = doc.status === 'paid';

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>{LABEL[doc.docType]}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card style={{ padding: 16 }}>
          <View style={styles.head}>
            <View>
              <Text style={styles.docType}>{LABEL[doc.docType]}</Text>
              <Text style={styles.num}>{doc.number}</Text>
            </View>
            <View style={[styles.badge, (approved || paid) && styles.badgeOk, converted && styles.badgeConv]}>
              <Text style={[styles.badgeText, (approved || converted || paid) && { color: '#fff' }]}>{paid ? 'Paid' : converted ? 'Converted' : approved ? 'Approved' : 'Sent'}</Text>
            </View>
          </View>
          <Text style={styles.billTo}>Bill to: <Text style={{ fontWeight: '700', color: Brand.ink }}>{doc.customerName || 'Customer'}</Text></Text>

          <View style={styles.lines}>
            {doc.lines.map((l, i) => (
              <View key={i} style={styles.lineRow}>
                <Text style={styles.lineDesc} numberOfLines={1}>{l.description} {l.qty > 1 ? `×${l.qty}` : ''}</Text>
                <Text style={styles.lineAmt}>{money(l.qty * l.unitPrice)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>{money(totals.total)}</Text></View>
          {doc.signedName && <Text style={styles.signed}>✓ Approved by {doc.signedName}{doc.signedAt ? ` · ${new Date(doc.signedAt).toLocaleDateString()}` : ''}</Text>}
        </Card>

        <Pressable style={styles.pdfBtn} onPress={downloadPdf} disabled={busy}>
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={styles.pdfText}>{busy ? 'Working…' : 'Download / share PDF'}</Text>
        </Pressable>

        {/* Payment (invoices/bills) */}
        {isBillable && (
          <Card style={styles.payCard}>
            <View style={styles.payRow}>
              <Text style={styles.payTitle}>Payment</Text>
              <Text style={[styles.payStatus, { color: paid ? Brand.green : Brand.star }]}>{paid ? 'Paid' : 'Unpaid'}</Text>
            </View>
            {!paid && (
              <View style={{ gap: 10, marginTop: 14 }}>
                <Pressable style={styles.remindBtn} onPress={sendReminder}>
                  <Ionicons name="mail-outline" size={16} color={Brand.red} />
                  <Text style={styles.remindText}>{reminded ? 'Reminder email opened ✓' : 'Send payment reminder (email)'}</Text>
                </Pressable>
                <Pressable style={styles.paidBtn} onPress={markPaid} disabled={busy}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.paidText}>Mark as paid</Text>
                </Pressable>
              </View>
            )}
          </Card>
        )}

        {/* Estimate sign-off */}
        {isEstimate && !approved && !converted && (
          <Card style={styles.signCard}>
            <Text style={styles.signTitle}>Client sign-off</Text>
            <Text style={styles.signSub}>Hand the phone to your client to approve this {LABEL[doc.docType].toLowerCase()}.</Text>
            <TextInput style={styles.signInput} placeholder="Client's full name" placeholderTextColor={Brand.muted} value={signName} onChangeText={setSignName} />
            <Pressable style={styles.approveBtn} onPress={approve} disabled={busy || !signName.trim()}>
              <Ionicons name="checkmark-done" size={18} color="#fff" />
              <Text style={styles.approveText}>I approve this {LABEL[doc.docType].toLowerCase()}</Text>
            </Pressable>
          </Card>
        )}

        {/* Convert approved estimate → invoice */}
        {isEstimate && approved && !converted && (
          <Pressable style={styles.convertBtn} onPress={convert} disabled={busy}>
            <Ionicons name="swap-horizontal" size={18} color={Brand.red} />
            <Text style={styles.convertText}>Convert to invoice</Text>
          </Pressable>
        )}
        {converted && (
          <Pressable style={styles.convertedRow} onPress={() => doc.convertedTo && router.replace({ pathname: '/doc/[id]', params: { id: doc.convertedTo } })}>
            <Ionicons name="checkmark-circle" size={16} color={Brand.green} />
            <Text style={styles.convertedText}>Converted to an invoice — tap to open</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  docType: { fontSize: 12, fontWeight: '800', color: Brand.red, textTransform: 'uppercase', letterSpacing: 0.5 },
  num: { fontSize: 18, fontWeight: '800', color: Brand.ink, marginTop: 2 },
  badge: { backgroundColor: Brand.surfaceAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  badgeOk: { backgroundColor: Brand.green },
  badgeConv: { backgroundColor: Brand.red },
  badgeText: { fontSize: 11, fontWeight: '800', color: Brand.body },
  billTo: { fontSize: 13, color: Brand.muted, marginTop: 12 },

  lines: { marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 8 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 12 },
  lineDesc: { flex: 1, fontSize: 14, color: Brand.body },
  lineAmt: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: Brand.line, marginTop: 6, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  totalVal: { fontSize: 18, fontWeight: '800', color: Brand.red },
  signed: { fontSize: 12, color: Brand.green, fontWeight: '700', marginTop: 12 },

  pdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 15, marginTop: 16 },
  pdfText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  payCard: { padding: 16, marginTop: 16 },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payTitle: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  payStatus: { fontSize: 14, fontWeight: '800' },
  remindBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Brand.red, borderRadius: 12, paddingVertical: 13 },
  remindText: { color: Brand.red, fontWeight: '800', fontSize: 14 },
  paidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.green, borderRadius: 12, paddingVertical: 13 },
  paidText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  signCard: { padding: 16, marginTop: 16 },
  signTitle: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  signSub: { fontSize: 13, color: Brand.muted, marginTop: 4, lineHeight: 18 },
  signInput: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Brand.ink, marginTop: 14 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.green, borderRadius: 12, paddingVertical: 14, marginTop: 14 },
  approveText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  convertBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Brand.red, borderRadius: 14, paddingVertical: 15, marginTop: 16 },
  convertText: { color: Brand.red, fontWeight: '800', fontSize: 15 },
  convertedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  convertedText: { color: Brand.green, fontWeight: '700', fontSize: 13 },
});
