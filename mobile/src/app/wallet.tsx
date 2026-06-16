import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, ListRow, SectionTitle } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchPayoutAccount } from '@/lib/db';
import { useStore } from '@/lib/store';
import type { PayoutAccount } from '@/lib/store-types';

export default function WalletScreen() {
  const { userId } = useAuth();
  const { proSummary, myQuotes } = useStore();
  const s = proSummary();
  const [done, setDone] = useState(false);
  const [payout, setPayout] = useState<PayoutAccount | null>(null);

  useEffect(() => {
    if (userId) fetchPayoutAccount(userId).then(setPayout);
  }, [userId]);

  const payoutLabel = !payout
    ? 'Not set up'
    : payout.method === 'wipay'
      ? `WiPay · ${payout.wipayNumber}`
      : `${payout.bankName} •••• ${payout.accountNumber.slice(-4)}`;

  // Transactions = money released from escrow on completed jobs.
  const txns = myQuotes()
    .filter((q) => q.bid.status === 'accepted' && q.job?.status === 'done')
    .map((q) => ({ id: q.bid.id, label: `Released — ${q.job?.title}`, sub: `${q.job?.area} · from escrow`, amount: q.bid.amount }));

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Wallet</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.balCard}>
          <Text style={styles.balLabel}>Available balance</Text>
          <Text style={styles.balValue}>TT${s.balance.toLocaleString()}</Text>
          <Pressable style={styles.withdrawBtn} onPress={() => setDone(true)} disabled={s.balance === 0}>
            <Ionicons name="cash-outline" size={18} color={Brand.red} />
            <Text style={styles.withdrawText}>{done ? 'Withdrawal requested ✓' : 'Withdraw funds'}</Text>
          </Pressable>
        </Card>

        <View style={styles.row2}>
          <View style={styles.miniCard}>
            <Ionicons name="lock-closed" size={18} color={Brand.star} />
            <Text style={styles.miniValue}>TT${s.escrowHeld.toLocaleString()}</Text>
            <Text style={styles.miniLabel}>Pending Escrow</Text>
          </View>
          <View style={styles.miniCard}>
            <Ionicons name="checkmark-done" size={18} color={Brand.green} />
            <Text style={styles.miniValue}>TT${s.released.toLocaleString()}</Text>
            <Text style={styles.miniLabel}>Released</Text>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="Transaction history" />
          <Card style={{ paddingVertical: 4 }}>
            {txns.length === 0 && <Text style={styles.empty}>No transactions yet. Funds appear here when a customer confirms a job is complete.</Text>}
            {txns.map((t, i) => (
              <View key={t.id} style={[styles.txn, i < txns.length - 1 && styles.divider]}>
                <Ionicons name="arrow-down-circle" size={26} color={Brand.green} />
                <View style={styles.grow}>
                  <Text style={styles.txnLabel}>{t.label}</Text>
                  <Text style={styles.txnSub}>{t.sub}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: Brand.green }]}>+TT${t.amount.toLocaleString()}</Text>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ marginTop: 22 }}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="business-outline" label="Payout account" value={payoutLabel} onPress={() => router.push('/payout-account')} last />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  balCard: { backgroundColor: Brand.ink, borderColor: Brand.ink, alignItems: 'center', paddingVertical: 24 },
  balLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balValue: { color: '#fff', fontSize: 42, fontWeight: '800', marginTop: 6, letterSpacing: -1 },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 18 },
  withdrawText: { color: Brand.red, fontWeight: '800', fontSize: 15 },

  row2: { flexDirection: 'row', gap: 12, marginTop: 14 },
  miniCard: { flex: 1, backgroundColor: Brand.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#0E1116', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  miniValue: { fontSize: 18, fontWeight: '800', color: Brand.ink, marginTop: 8 },
  miniLabel: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  grow: { flex: 1 },
  txnLabel: { fontSize: 14, fontWeight: '600', color: Brand.ink },
  txnSub: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800' },
  empty: { color: Brand.muted, paddingVertical: 16, fontSize: 13, lineHeight: 20 },
});
