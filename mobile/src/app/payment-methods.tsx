import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';

export default function PaymentMethodsScreen() {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Payment Methods</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color={Brand.green} />
          <Text style={styles.infoText}>
            Payments are processed securely by WiPay. Funds for a job are held in escrow until you
            confirm the work is done.
          </Text>
        </View>

        <Text style={styles.section}>Your cards</Text>
        <View style={styles.empty}>
          <Ionicons name="card-outline" size={28} color={Brand.muted} />
          <Text style={styles.emptyTitle}>No card saved yet</Text>
          <Text style={styles.emptySub}>Secure card & WiPay checkout is being finalised. You'll add a payment method here when you hire a tradesman.</Text>
        </View>

        <Text style={styles.section}>Payout account (for tradesmen)</Text>
        <Pressable style={styles.card} onPress={() => router.push('/payout-account')}>
          <View style={styles.cardIcon}>
            <Ionicons name="business" size={22} color={Brand.ink} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.cardBrand}>Set up payout account</Text>
            <Text style={styles.cardExp}>Where your earnings are paid out</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  grow: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: '#F1FBF5', borderRadius: 14, padding: 14, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 13, color: Brand.body, lineHeight: 19 },

  section: { fontSize: 14, fontWeight: '800', color: Brand.ink, marginTop: 24, marginBottom: 12 },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 28, borderWidth: 1, borderColor: Brand.line, borderStyle: 'dashed', borderRadius: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  emptySub: { fontSize: 13, color: Brand.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 24 },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 14 },
  cardIcon: { width: 44, height: 44, borderRadius: 11, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  cardBrand: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  cardExp: { fontSize: 12, color: Brand.muted, marginTop: 2 },
});
