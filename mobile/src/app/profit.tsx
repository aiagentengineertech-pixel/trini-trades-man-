import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Ambient, Card, SectionTitle } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchClients, fetchExpenses, fetchInvoices } from '@/lib/db';
import type { Client, Expense } from '@/lib/store-types';
import type { SavedInvoice } from '@/lib/db';

const money = (n: number) => `TT$${Math.round(n).toLocaleString()}`;

export default function ProfitScreen() {
  const { userId } = useAuth();
  const premium = usePremium();
  const expensesOn = useFeature('expenses');
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchInvoices(userId).then(setInvoices);
    fetchExpenses(userId).then(setExpenses);
    fetchClients(userId).then(setClients);
  }, [userId]);

  if (!premium) return <PremiumGateScreen title="Profit" feature="The profit matrix" />;
  if (!expensesOn) return <FeatureGateScreen title="Profit" feature="Profit & expenses" />;

  const billed = invoices.filter((i) => i.docType === 'invoice' || i.docType === 'bill');
  const income = billed.reduce((s, i) => s + i.total, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const net = income - spent;
  const margin = income > 0 ? Math.round((net / income) * 100) : 0;

  // per-client breakdown
  const byClient = new Map<string, { name: string; income: number; spent: number }>();
  const ensure = (id: string | null) => {
    const key = id ?? 'general';
    if (!byClient.has(key)) byClient.set(key, { name: id ? clients.find((c) => c.id === id)?.name ?? 'Client' : 'General / unassigned', income: 0, spent: 0 });
    return byClient.get(key)!;
  };
  billed.forEach((i) => { ensure(i.clientId).income += i.total; });
  expenses.forEach((e) => { ensure(e.clientId).spent += e.amount; });
  const rows = [...byClient.values()].map((r) => ({ ...r, net: r.income - r.spent })).sort((a, b) => b.net - a.net);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Profit Matrix</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card style={{ ...styles.net, ...(net >= 0 ? styles.netPos : styles.netNeg) }}>
          <Text style={styles.netLabel}>Net profit</Text>
          <Text style={styles.netVal}>{money(net)}</Text>
          <Text style={styles.netSub}>{margin}% margin on {money(income)} billed</Text>
        </Card>

        <View style={styles.row2}>
          <View style={[styles.mini, { borderColor: '#CDEBD8' }]}>
            <Ionicons name="trending-up" size={18} color={Brand.green} />
            <Text style={styles.miniVal}>{money(income)}</Text>
            <Text style={styles.miniLabel}>Gross income</Text>
          </View>
          <View style={[styles.mini, { borderColor: '#F6D5D6' }]}>
            <Ionicons name="trending-down" size={18} color={Brand.red} />
            <Text style={styles.miniVal}>{money(spent)}</Text>
            <Text style={styles.miniLabel}>Expenses</Text>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="By client / job" />
          {rows.length === 0 ? (
            <Text style={styles.empty}>No billed invoices or expenses yet. Create invoices and log receipts to see your profit per job.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {rows.map((r, i) => (
                <Card key={i} style={styles.clientRow}>
                  <View style={styles.grow}>
                    <Text style={styles.clientName}>{r.name}</Text>
                    <Text style={styles.clientMeta}>{money(r.income)} in · {money(r.spent)} out</Text>
                  </View>
                  <Text style={[styles.clientNet, { color: r.net >= 0 ? Brand.green : Brand.red }]}>{money(r.net)}</Text>
                </Card>
              ))}
            </View>
          )}
        </View>

        <Pressable style={styles.expBtn} onPress={() => router.push('/expenses')}>
          <Ionicons name="receipt-outline" size={18} color={Brand.red} />
          <Text style={styles.expBtnText}>Manage expenses</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  grow: { flex: 1 },

  net: { alignItems: 'center', paddingVertical: 24, borderWidth: 0 },
  netPos: { backgroundColor: Brand.green },
  netNeg: { backgroundColor: Brand.red },
  netLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  netVal: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: -1 },
  netSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 6 },

  row2: { flexDirection: 'row', gap: 12, marginTop: 14 },
  mini: { flex: 1, backgroundColor: Brand.surface, borderRadius: 16, padding: 16, borderWidth: 1 },
  miniVal: { fontSize: 18, fontWeight: '800', color: Brand.ink, marginTop: 8 },
  miniLabel: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  empty: { fontSize: 13, color: Brand.muted, lineHeight: 19 },
  clientRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  clientName: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  clientMeta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  clientNet: { fontSize: 16, fontWeight: '800' },

  expBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Brand.red, borderRadius: 14, paddingVertical: 15, marginTop: 22 },
  expBtnText: { color: Brand.red, fontWeight: '800', fontSize: 15 },
});
