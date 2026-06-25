import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented } from '@/components/ui';
import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchCatalog, fetchInvoiceSettings, saveInvoice } from '@/lib/db';
import { generateInvoicePdf, invoiceTotals, type InvoiceLine } from '@/lib/invoice';
import type { CatalogItem, DocType, InvoiceSettings } from '@/lib/store-types';

const money = (n: number) => `TT$${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
const DOC_TABS = ['Invoice', 'Estimate', 'Quote', 'Bill'];
const PREFIX: Record<DocType, string> = { invoice: 'INV', bill: 'BILL', estimate: 'EST', quote: 'QTE' };
const toDocType = (s: string): DocType => (s.toLowerCase() as DocType);

export default function InvoiceBuilderScreen() {
  const { userId } = useAuth();
  const premium = usePremium();
  const invoicesOn = useFeature('invoices');
  const params = useLocalSearchParams<{ type?: string; clientId?: string; clientName?: string }>();
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [docTab, setDocTab] = useState(params.type && DOC_TABS.map((t) => t.toLowerCase()).includes(params.type) ? params.type[0].toUpperCase() + params.type.slice(1) : 'Invoice');
  const [customer, setCustomer] = useState(params.clientName ?? '');
  const clientId = params.clientId ?? null;
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [vat, setVat] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchInvoiceSettings(userId).then(setSettings);
    fetchCatalog(userId).then(setCatalog);
  }, [userId]);

  const docType = toDocType(docTab);
  const draft = useMemo(() => ({
    docType,
    number: `${PREFIX[docType]}-${String(Date.now()).slice(-6)}`,
    date: new Date().toLocaleDateString(),
    customerName: customer,
    lines,
    taxPct: vat ? 12.5 : 0,
  }), [docType, customer, lines, vat]);
  const totals = invoiceTotals(draft);

  const addLine = (l: InvoiceLine) => setLines((p) => [...p, l]);
  const updateLine = (i: number, patch: Partial<InvoiceLine>) => setLines((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines((p) => p.filter((_, idx) => idx !== i));

  const generate = async () => {
    const effective: InvoiceSettings = settings ?? {
      businessName: '', logoUrl: null, brandColor: '#8C1C2B', taxId: '',
      paymentTerms: '', footerNote: '', contactPhone: '', contactEmail: '',
    };
    setGenerating(true);
    try {
      await generateInvoicePdf(effective, draft);
      if (userId) {
        const id = await saveInvoice(userId, { docType, number: draft.number, customerName: draft.customerName, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, clientId }, draft.lines);
        if (id) setSavedId(id);
      }
    } finally { setGenerating(false); }
  };

  const needsBranding = !settings || !settings.businessName;

  if (!premium) return <PremiumGateScreen title="New Invoice" feature="The invoice generator" />;
  if (!invoicesOn) return <FeatureGateScreen title="New Invoice" feature="Invoicing" />;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>New {docTab}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* quick links */}
          <View style={styles.links}>
            <Pressable style={styles.linkBtn} onPress={() => router.push('/invoice-settings')}>
              <Ionicons name="color-palette-outline" size={16} color={Brand.ink} />
              <Text style={styles.linkText}>Branding</Text>
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={() => router.push('/catalog')}>
              <Ionicons name="pricetags-outline" size={16} color={Brand.ink} />
              <Text style={styles.linkText}>Price book</Text>
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={() => router.push('/invoices')}>
              <Ionicons name="time-outline" size={16} color={Brand.ink} />
              <Text style={styles.linkText}>History</Text>
            </Pressable>
          </View>
          {needsBranding && (
            <Pressable style={styles.brandNudge} onPress={() => router.push('/invoice-settings')}>
              <Ionicons name="information-circle" size={18} color={Brand.red} />
              <Text style={styles.brandNudgeText}>Set up your logo & business details so invoices look professional.</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Document type</Text>
          <Segmented options={DOC_TABS} value={docTab} onChange={setDocTab} />

          <Text style={styles.label}>Bill to</Text>
          <TextInput style={styles.input} placeholder="Customer name" placeholderTextColor={Brand.muted} value={customer} onChangeText={setCustomer} />

          <View style={styles.lineHead}>
            <Text style={styles.label}>Items</Text>
            <Pressable style={styles.addItem} onPress={() => setPickerOpen(true)}>
              <Ionicons name="add" size={16} color={Brand.red} />
              <Text style={styles.addItemText}>Add item</Text>
            </Pressable>
          </View>

          {lines.length === 0 && <Text style={styles.emptyLines}>Add services or materials from your price book — or a custom line.</Text>}

          <View style={{ gap: 10 }}>
            {lines.map((l, i) => (
              <Card key={i} style={styles.lineCard}>
                <View style={styles.lineTop}>
                  <TextInput style={styles.lineDesc} value={l.description} onChangeText={(v) => updateLine(i, { description: v })} placeholder="Description" placeholderTextColor={Brand.muted} />
                  <Pressable onPress={() => removeLine(i)} hitSlop={8}><Ionicons name="close-circle" size={20} color={Brand.muted} /></Pressable>
                </View>
                <View style={styles.lineBottom}>
                  <View style={styles.qtyBox}>
                    <Text style={styles.miniLabel}>Qty</Text>
                    <TextInput style={styles.miniInput} keyboardType="numeric" value={String(l.qty)} onChangeText={(v) => updateLine(i, { qty: Number(v) || 0 })} />
                  </View>
                  <View style={styles.qtyBox}>
                    <Text style={styles.miniLabel}>Unit price</Text>
                    <TextInput style={styles.miniInput} keyboardType="numeric" value={String(l.unitPrice)} onChangeText={(v) => updateLine(i, { unitPrice: Number(v) || 0 })} />
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={styles.miniLabel}>Amount</Text>
                    <Text style={styles.amountVal}>{money(l.qty * l.unitPrice)}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          <Pressable style={styles.customBtn} onPress={() => addLine({ description: '', qty: 1, unitPrice: 0 })}>
            <Ionicons name="create-outline" size={16} color={Brand.body} />
            <Text style={styles.customText}>Add custom line</Text>
          </Pressable>

          {/* VAT + totals */}
          <Card style={styles.totalsCard}>
            <Pressable style={styles.vatRow} onPress={() => setVat((v) => !v)}>
              <Text style={styles.vatLabel}>Add VAT (12.5%)</Text>
              <View style={[styles.toggle, vat && styles.toggleOn]}><View style={[styles.knob, vat && styles.knobOn]} /></View>
            </Pressable>
            <View style={styles.tRow}><Text style={styles.tMuted}>Subtotal</Text><Text style={styles.tVal}>{money(totals.subtotal)}</Text></View>
            {vat && <View style={styles.tRow}><Text style={styles.tMuted}>VAT</Text><Text style={styles.tVal}>{money(totals.tax)}</Text></View>}
            <View style={[styles.tRow, styles.grand]}><Text style={styles.grandLabel}>Total</Text><Text style={styles.grandVal}>{money(totals.total)}</Text></View>
          </Card>

          <Pressable style={[styles.genBtn, lines.length === 0 && { opacity: 0.5 }]} onPress={generate} disabled={generating || lines.length === 0}>
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text style={styles.genBtnText}>{generating ? 'Generating…' : 'Generate branded PDF'}</Text>
          </Pressable>
          {savedId && (
            <Pressable style={styles.savedRow} onPress={() => router.push('/invoices')}>
              <Ionicons name="checkmark-circle" size={16} color={Brand.green} />
              <Text style={styles.savedText}>Saved to invoice history — tap to view</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {pickerOpen && (
        <CatalogPicker
          catalog={catalog}
          onPick={(it) => { addLine({ description: it.name + (it.unit ? ` (per ${it.unit})` : ''), qty: 1, unitPrice: it.price }); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
          onManage={() => { setPickerOpen(false); router.push('/catalog'); }}
        />
      )}
    </SafeAreaView>
  );
}

function CatalogPicker({ catalog, onPick, onClose, onManage }: { catalog: CatalogItem[]; onPick: (i: CatalogItem) => void; onClose: () => void; onManage: () => void }) {
  const [q, setQ] = useState('');
  const list = catalog.filter((i) => !q || i.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Add from price book</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={Brand.ink} /></Pressable>
          </View>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={Brand.muted} />
            <TextInput placeholder="Search items…" placeholderTextColor={Brand.muted} style={styles.searchInput} value={q} onChangeText={setQ} autoFocus />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }}>
            {list.length === 0 && (
              <View style={styles.pickerEmpty}>
                <Text style={styles.pickerEmptyText}>{catalog.length === 0 ? 'Your price book is empty.' : 'No matches.'}</Text>
                <Pressable style={styles.manageBtn} onPress={onManage}><Text style={styles.manageText}>Manage price book</Text></Pressable>
              </View>
            )}
            {list.map((it) => (
              <Pressable key={it.id} style={styles.pickRow} onPress={() => onPick(it)}>
                <Ionicons name={it.kind === 'material' ? 'cube-outline' : 'construct-outline'} size={18} color={it.kind === 'material' ? '#2F6FED' : Brand.red} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName}>{it.name}</Text>
                  {!!it.unit && <Text style={styles.pickUnit}>per {it.unit}</Text>}
                </View>
                <Text style={styles.pickPrice}>TT${it.price.toLocaleString()}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  links: { flexDirection: 'row', gap: 10 },
  linkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Brand.surfaceAlt, borderRadius: 12, paddingVertical: 11 },
  linkText: { fontSize: 13, fontWeight: '700', color: Brand.ink },
  brandNudge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.redSoft, borderRadius: 12, padding: 12, marginTop: 12 },
  brandNudgeText: { flex: 1, fontSize: 12, color: Brand.body, lineHeight: 17 },

  label: { fontSize: 14, fontWeight: '700', color: Brand.ink, marginTop: 22, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Brand.ink },

  lineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  addItemText: { color: Brand.red, fontWeight: '700', fontSize: 14 },
  emptyLines: { fontSize: 13, color: Brand.muted, lineHeight: 19, marginBottom: 10 },

  lineCard: { padding: 14 },
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineDesc: { flex: 1, fontSize: 15, fontWeight: '600', color: Brand.ink, paddingVertical: 2 },
  lineBottom: { flexDirection: 'row', gap: 10, marginTop: 12 },
  qtyBox: { flex: 1 },
  miniLabel: { fontSize: 11, color: Brand.muted, marginBottom: 4 },
  miniInput: { borderWidth: 1, borderColor: Brand.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: Brand.ink },
  amountBox: { flex: 1 },
  amountVal: { fontSize: 15, fontWeight: '800', color: Brand.ink, paddingVertical: 8 },

  customBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.line, borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  customText: { color: Brand.body, fontWeight: '600', fontSize: 14 },

  totalsCard: { marginTop: 18, padding: 16 },
  vatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  vatLabel: { fontSize: 14, fontWeight: '600', color: Brand.ink },
  toggle: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#D9DBDF', padding: 3 },
  toggleOn: { backgroundColor: Brand.red },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  tMuted: { fontSize: 14, color: Brand.muted },
  tVal: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  grand: { borderTopWidth: 2, borderTopColor: Brand.line, marginTop: 4, paddingTop: 10 },
  grandLabel: { fontSize: 17, fontWeight: '800', color: Brand.ink },
  grandVal: { fontSize: 20, fontWeight: '800', color: Brand.red },

  genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.ink, borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  genBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  savedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  savedText: { color: Brand.green, fontWeight: '700', fontSize: 13 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.line, marginBottom: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, marginBottom: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Brand.ink },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  pickName: { fontSize: 15, fontWeight: '600', color: Brand.ink },
  pickUnit: { fontSize: 12, color: Brand.muted, marginTop: 1 },
  pickPrice: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  pickerEmpty: { alignItems: 'center', gap: 12, paddingVertical: 30 },
  pickerEmptyText: { color: Brand.muted, fontSize: 14 },
  manageBtn: { backgroundColor: Brand.red, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  manageText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
