import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';

interface Card {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  primary: boolean;
}

const INITIAL: Card[] = [
  { id: '1', brand: 'Visa', last4: '4242', exp: '08/27', primary: true },
];

export default function PaymentMethodsScreen() {
  const [cards, setCards] = useState<Card[]>(INITIAL);

  const addDemoCard = () => {
    setCards((prev) => [
      ...prev,
      { id: String(prev.length + 1), brand: 'Mastercard', last4: '5518', exp: '03/28', primary: false },
    ]);
  };

  const makePrimary = (id: string) =>
    setCards((prev) => prev.map((c) => ({ ...c, primary: c.id === id })));

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
        {cards.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="card" size={22} color={Brand.ink} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardBrand}>{c.brand} •••• {c.last4}</Text>
              <Text style={styles.cardExp}>Expires {c.exp}</Text>
            </View>
            {c.primary ? (
              <View style={styles.primaryTag}><Text style={styles.primaryTagText}>Default</Text></View>
            ) : (
              <Pressable onPress={() => makePrimary(c.id)}>
                <Text style={styles.makeDefault}>Make default</Text>
              </Pressable>
            )}
          </View>
        ))}

        <Pressable style={styles.addBtn} onPress={addDemoCard}>
          <Ionicons name="add" size={20} color={Brand.red} />
          <Text style={styles.addBtnText}>Add payment method</Text>
        </Pressable>

        <Text style={styles.section}>Payout account (for tradesmen)</Text>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="business" size={22} color={Brand.ink} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardBrand}>Republic Bank •••• 7781</Text>
            <Text style={styles.cardExp}>Earnings are paid out here</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: '#F1FBF5', borderRadius: 14, padding: 14, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 13, color: Brand.body, lineHeight: 19 },

  section: { fontSize: 14, fontWeight: '800', color: Brand.ink, marginTop: 24, marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 14, marginBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 11, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  cardBrand: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  cardExp: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  primaryTag: { backgroundColor: Brand.redSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  primaryTagText: { color: Brand.red, fontSize: 11, fontWeight: '700' },
  makeDefault: { color: Brand.red, fontSize: 12, fontWeight: '700' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.red, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  addBtnText: { color: Brand.red, fontWeight: '700', fontSize: 15 },
});
