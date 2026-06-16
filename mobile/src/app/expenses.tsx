import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Card } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { addExpense, deleteExpense, fetchClients, fetchExpenses } from '@/lib/db';
import { pickImage, takePhoto } from '@/lib/images';
import type { Client, Expense } from '@/lib/store-types';

const VENDORS = ["Bhagwansingh's", 'FT Farfan', 'TIKI', 'Standard Distributors', 'Other'];
const CATEGORIES = ['Materials', 'Fuel', 'Tools', 'Labour', 'Permits', 'Other'];
const CAT_ICON: Record<string, string> = { materials: 'cube', fuel: 'car', tools: 'construct', labour: 'people', permits: 'document', other: 'pricetag' };

export default function ExpensesScreen() {
  const { userId } = useAuth();
  const premium = usePremium();
  const expensesOn = useFeature('expenses');
  const params = useLocalSearchParams<{ clientId?: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setExpenses(await fetchExpenses(userId));
    setClients(await fetchClients(userId));
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  if (!premium) return <PremiumGateScreen title="Expenses" feature="The expense tracker" />;
  if (!expensesOn) return <FeatureGateScreen title="Expenses" feature="Expense tracking" />;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? 'General';

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Expenses</Text>
        <Pressable onPress={() => setOpen(true)} hitSlop={10}><Ionicons name="add" size={26} color={Brand.red} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total logged</Text>
          <Text style={styles.totalVal}>TT${total.toLocaleString()}</Text>
          <Text style={styles.totalSub}>{expenses.length} receipt{expenses.length === 1 ? '' : 's'}</Text>
        </Card>

        {expenses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={32} color={Brand.muted} />
            <Text style={styles.emptyText}>No expenses yet.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => setOpen(true)}><Text style={styles.emptyBtnText}>Log a receipt</Text></Pressable>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {expenses.map((e) => (
              <Card key={e.id} style={styles.row}>
                {e.receiptUrl ? (
                  <Image source={{ uri: e.receiptUrl }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={styles.catIcon}><Ionicons name={(CAT_ICON[e.category] ?? 'pricetag') as any} size={18} color={Brand.body} /></View>
                )}
                <View style={styles.grow}>
                  <Text style={styles.vendor}>{e.vendor || e.category}</Text>
                  <Text style={styles.meta}>{clientName(e.clientId)} · {e.spentOn}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.amt}>TT${e.amount.toLocaleString()}</Text>
                  <Pressable onPress={async () => { await deleteExpense(e.id); load(); }} hitSlop={8}><Ionicons name="trash-outline" size={16} color={Brand.muted} /></Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {open && (
        <ExpenseEditor userId={userId!} clients={clients} initialClientId={params.clientId ?? null}
          onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
      )}
    </SafeAreaView>
  );
}

function ExpenseEditor({ userId, clients, initialClientId, onClose, onSaved }: { userId: string; clients: Client[]; initialClientId: string | null; onClose: () => void; onSaved: () => void }) {
  const [vendor, setVendor] = useState('');
  const [customVendor, setCustomVendor] = useState('');
  const [category, setCategory] = useState('Materials');
  const [amount, setAmount] = useState('');
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!Number(amount)) return;
    setBusy(true);
    const v = vendor === 'Other' ? customVendor.trim() : vendor;
    await addExpense(userId, { clientId, vendor: v, category: category.toLowerCase(), amount: Number(amount), note }, receipt);
    setBusy(false);
    onSaved();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Log a receipt</Text>
              <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={Brand.ink} /></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.receiptRow}>
                {receipt ? (
                  <Image source={{ uri: receipt }} style={styles.receiptImg} contentFit="cover" />
                ) : (
                  <View style={styles.receiptPlaceholder}><Ionicons name="receipt-outline" size={28} color={Brand.muted} /></View>
                )}
                <View style={{ gap: 8, flex: 1 }}>
                  <Pressable style={styles.snapBtn} onPress={async () => { const u = await takePhoto(); if (u) setReceipt(u); }}>
                    <Ionicons name="camera" size={16} color="#fff" /><Text style={styles.snapText}>Snap receipt</Text>
                  </Pressable>
                  <Pressable style={styles.libBtn} onPress={async () => { const u = await pickImage(); if (u) setReceipt(u); }}>
                    <Ionicons name="image-outline" size={16} color={Brand.ink} /><Text style={styles.libText}>Choose photo</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.flabel}>Amount (TTD)</Text>
              <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={Brand.muted} keyboardType="numeric" value={amount} onChangeText={setAmount} />

              <Text style={styles.flabel}>Where</Text>
              <View style={styles.chips}>
                {VENDORS.map((v) => (
                  <Pressable key={v} onPress={() => setVendor(v)} style={[styles.chip, vendor === v && styles.chipOn]}>
                    <Text style={[styles.chipText, vendor === v && styles.chipTextOn]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
              {vendor === 'Other' && <TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Vendor name" placeholderTextColor={Brand.muted} value={customVendor} onChangeText={setCustomVendor} />}

              <Text style={styles.flabel}>Category</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
                    <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.flabel}>Charge to client (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Pressable onPress={() => setClientId(null)} style={[styles.chip, clientId === null && styles.chipOn]}>
                  <Text style={[styles.chipText, clientId === null && styles.chipTextOn]}>General</Text>
                </Pressable>
                {clients.map((c) => (
                  <Pressable key={c.id} onPress={() => setClientId(c.id)} style={[styles.chip, clientId === c.id && styles.chipOn]}>
                    <Text style={[styles.chipText, clientId === c.id && styles.chipTextOn]}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.flabel}>Note</Text>
              <TextInput style={styles.input} placeholder="e.g. PVC + fittings" placeholderTextColor={Brand.muted} value={note} onChangeText={setNote} />

              <Pressable style={styles.saveBtn} onPress={save} disabled={busy}>
                <Text style={styles.saveBtnText}>{busy ? 'Saving…' : 'Save expense'}</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  grow: { flex: 1 },

  totalCard: { backgroundColor: Brand.ink, borderColor: Brand.ink, alignItems: 'center', paddingVertical: 22 },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  totalVal: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  totalSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  empty: { alignItems: 'center', gap: 12, paddingVertical: 50 },
  emptyText: { fontSize: 14, color: Brand.muted },
  emptyBtn: { backgroundColor: Brand.red, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: Brand.surfaceAlt },
  catIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  vendor: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  amt: { fontSize: 15, fontWeight: '800', color: Brand.ink },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.line, marginBottom: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink },

  receiptRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  receiptImg: { width: 90, height: 90, borderRadius: 12, backgroundColor: Brand.surfaceAlt },
  receiptPlaceholder: { width: 90, height: 90, borderRadius: 12, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  snapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Brand.red, borderRadius: 10, paddingVertical: 12 },
  snapText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  libBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Brand.surfaceAlt, borderRadius: 10, paddingVertical: 12 },
  libText: { color: Brand.ink, fontWeight: '700', fontSize: 14 },

  flabel: { fontSize: 13, fontWeight: '700', color: Brand.ink, marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Brand.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.line },
  chipOn: { backgroundColor: Brand.red, borderColor: Brand.red },
  chipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  chipTextOn: { color: '#fff' },
  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 22, marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
