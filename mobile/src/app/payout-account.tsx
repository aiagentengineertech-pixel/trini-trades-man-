import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ambient, Card, Segmented } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchPayoutAccount, savePayoutAccount } from '@/lib/db';

const BANKS = ['Republic Bank', 'First Citizens', 'Scotiabank', 'RBC', 'JMMB'];

export default function PayoutAccountScreen() {
  const { userId } = useAuth();
  const [method, setMethod] = useState<'Bank Transfer' | 'WiPay'>('Bank Transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [wipayNumber, setWipayNumber] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchPayoutAccount(userId).then((a) => {
      if (!a) return;
      setMethod(a.method === 'wipay' ? 'WiPay' : 'Bank Transfer');
      setBankName(a.bankName);
      setAccountNumber(a.accountNumber);
      setAccountHolder(a.accountHolder);
      setWipayNumber(a.wipayNumber);
    });
  }, [userId]);

  const save = async () => {
    setError(null);
    if (!userId) return;
    if (method === 'Bank Transfer' && (!bankName || !accountNumber.trim() || !accountHolder.trim())) {
      setError('Fill in your bank, account number, and account holder name.');
      return;
    }
    if (method === 'WiPay' && !wipayNumber.trim()) {
      setError('Enter your WiPay number or email.');
      return;
    }
    setBusy(true);
    const ok = await savePayoutAccount(userId, {
      method: method === 'WiPay' ? 'wipay' : 'bank',
      bankName,
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      wipayNumber: wipayNumber.trim(),
    });
    setBusy(false);
    if (!ok) { setError('Could not save. Please try again.'); return; }
    setSaved(true);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Payout Account</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <View style={styles.info}>
            <Ionicons name="lock-closed" size={18} color={Brand.green} />
            <Text style={styles.infoText}>This is where your earnings are paid out. Your details are private and only visible to you.</Text>
          </View>

          <Text style={styles.label}>Payout method</Text>
          <Segmented options={['Bank Transfer', 'WiPay']} value={method} onChange={(v) => setMethod(v as 'Bank Transfer' | 'WiPay')} />

          {method === 'Bank Transfer' ? (
            <>
              <Text style={styles.label}>Bank</Text>
              <View style={styles.bankGrid}>
                {BANKS.map((b) => (
                  <Pressable key={b} onPress={() => setBankName(b)} style={[styles.bankChip, bankName === b && styles.bankChipActive]}>
                    <Text style={[styles.bankChipText, bankName === b && styles.bankChipTextActive]}>{b}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Account number</Text>
              <TextInput style={styles.input} placeholder="e.g. 0012345678" placeholderTextColor={Brand.muted} keyboardType="numeric" value={accountNumber} onChangeText={setAccountNumber} />
              <Text style={styles.label}>Account holder name</Text>
              <TextInput style={styles.input} placeholder="Name on the account" placeholderTextColor={Brand.muted} value={accountHolder} onChangeText={setAccountHolder} />
            </>
          ) : (
            <>
              <Text style={styles.label}>WiPay number or email</Text>
              <TextInput style={styles.input} placeholder="WiPay account email or number" placeholderTextColor={Brand.muted} autoCapitalize="none" value={wipayNumber} onChangeText={setWipayNumber} />
              <Text style={styles.note}>Funds are sent to your linked WiPay account, usually within 1–2 business days.</Text>
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
          {saved && (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={Brand.green} />
              <Text style={styles.savedText}>Payout account saved</Text>
            </View>
          )}

          <Pressable style={styles.saveBtn} onPress={save} disabled={busy}>
            <Text style={styles.saveBtnText}>{busy ? 'Saving…' : 'Save payout account'}</Text>
          </Pressable>

          <Card style={styles.howCard}>
            <Text style={styles.howTitle}>How payouts work</Text>
            <Text style={styles.howText}>
              When a customer confirms a job is done, the escrow is released to your Wallet. You
              withdraw to this account — payouts are processed by Trini Side Hustle (less the platform
              commission).
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  info: { flexDirection: 'row', gap: 10, backgroundColor: '#F1FBF5', borderRadius: 14, padding: 14, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 13, color: Brand.body, lineHeight: 19 },

  label: { fontSize: 14, fontWeight: '700', color: Brand.ink, marginTop: 20, marginBottom: 10 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bankChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.line },
  bankChipActive: { backgroundColor: Brand.red, borderColor: Brand.red },
  bankChipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  bankChipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Brand.ink },
  note: { fontSize: 12, color: Brand.muted, marginTop: 10, lineHeight: 17 },

  error: { color: Brand.red, fontWeight: '600', marginTop: 16 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  savedText: { color: Brand.green, fontWeight: '700' },
  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  howCard: { marginTop: 24 },
  howTitle: { fontSize: 15, fontWeight: '800', color: Brand.ink, marginBottom: 8 },
  howText: { fontSize: 13, color: Brand.body, lineHeight: 20 },
});
