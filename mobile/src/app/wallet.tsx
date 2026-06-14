import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, ListRow, SectionTitle, type IconName } from '@/components/ui';
import { Brand } from '@/constants/brand';

const TXNS: { label: string; sub: string; amount: string; positive: boolean; icon: IconName }[] = [
  { label: 'Payout to Republic Bank', sub: 'Jun 12 · Completed', amount: '-TT$3,200', positive: false, icon: 'arrow-up-circle' },
  { label: 'Job released — Kitchen rewire', sub: 'Jun 10 · From escrow', amount: '+TT$6,500', positive: true, icon: 'arrow-down-circle' },
  { label: 'Job released — AC service', sub: 'May 28 · From escrow', amount: '+TT$450', positive: true, icon: 'arrow-down-circle' },
  { label: 'Payout to Republic Bank', sub: 'May 20 · Completed', amount: '-TT$2,100', positive: false, icon: 'arrow-up-circle' },
];

export default function WalletScreen() {
  const [done, setDone] = useState(false);
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
          <Text style={styles.balValue}>TT$2,950</Text>
          <Pressable style={styles.withdrawBtn} onPress={() => setDone(true)}>
            <Ionicons name="cash-outline" size={18} color={Brand.red} />
            <Text style={styles.withdrawText}>{done ? 'Withdrawal requested ✓' : 'Withdraw funds'}</Text>
          </Pressable>
        </Card>

        <View style={styles.row2}>
          <View style={styles.miniCard}>
            <Ionicons name="lock-closed" size={18} color={Brand.star} />
            <Text style={styles.miniValue}>TT$1,800</Text>
            <Text style={styles.miniLabel}>Pending Escrow</Text>
          </View>
          <View style={styles.miniCard}>
            <Ionicons name="checkmark-done" size={18} color={Brand.green} />
            <Text style={styles.miniValue}>TT$18,400</Text>
            <Text style={styles.miniLabel}>Released (YTD)</Text>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="Transaction history" />
          <Card style={{ paddingVertical: 4 }}>
            {TXNS.map((t, i) => (
              <View key={i} style={[styles.txn, i < TXNS.length - 1 && styles.divider]}>
                <Ionicons name={t.icon} size={26} color={t.positive ? Brand.green : Brand.muted} />
                <View style={styles.flex}>
                  <Text style={styles.txnLabel}>{t.label}</Text>
                  <Text style={styles.txnSub}>{t.sub}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: t.positive ? Brand.green : Brand.ink }]}>{t.amount}</Text>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ marginTop: 22 }}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="document-text-outline" label="Tax reports" value="2026" onPress={() => {}} />
            <ListRow icon="business-outline" label="Payout account" value="Republic •••• 7781" onPress={() => router.push('/payment-methods')} last />
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
  txnLabel: { fontSize: 14, fontWeight: '600', color: Brand.ink },
  txnSub: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800' },
});
