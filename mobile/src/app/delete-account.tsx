import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ambient } from '@/components/ui';

import { Brand } from '@/constants/brand';
import { LEGAL_INFO } from '@/constants/legal';
import { useAuth } from '@/lib/auth';
import { deleteMyAccount } from '@/lib/db';

// Public account-deletion page (reachable at /delete-account without installing).
// Satisfies the Apple/Google requirement for an in-app + web deletion path.
export default function DeleteAccountScreen() {
  const { signedIn, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const doDelete = async () => {
    setBusy(true);
    setErr(null);
    const res = await deleteMyAccount();
    setBusy(false);
    if (!res.ok) { setErr(res.error ?? 'Could not delete your account. Please try again.'); return; }
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Delete account</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <View style={styles.iconWrap}>
          <Ionicons name="trash-outline" size={28} color={Brand.red} />
        </View>
        <Text style={styles.h1}>Permanently delete your {LEGAL_INFO.appName} account</Text>

        <Text style={styles.p}>
          This permanently removes your account and your personal data. It cannot be undone.
        </Text>

        <Text style={styles.subh}>What gets deleted</Text>
        {[
          'Your profile, photo and contact details',
          'Your jobs, quotes, hires and messages',
          'Your reviews, portfolio and saved clients',
          'Your login — you will be signed out everywhere',
        ].map((t) => (
          <View key={t} style={styles.bulletRow}>
            <Ionicons name="close-circle" size={16} color={Brand.red} />
            <Text style={styles.bulletText}>{t}</Text>
          </View>
        ))}

        <Text style={styles.note}>
          Some records may be kept briefly where the law requires (for example tax or
          dispute records), then deleted.
        </Text>

        {err && (
          <View style={styles.errBox}>
            <Ionicons name="warning-outline" size={16} color={Brand.red} />
            <Text style={styles.errText}>{err}</Text>
          </View>
        )}

        {signedIn ? (
          confirming ? (
            <View style={styles.confirmRow}>
              <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => setConfirming(false)} disabled={busy}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.deleteBtn]} onPress={doDelete} disabled={busy}>
                <Text style={styles.deleteText}>{busy ? 'Deleting…' : 'Yes, delete'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={[styles.btn, styles.deleteBtn, { marginTop: 24 }]} onPress={() => setConfirming(true)}>
              <Text style={styles.deleteText}>Delete my account</Text>
            </Pressable>
          )
        ) : (
          <View style={styles.signedOutBox}>
            <Text style={styles.signedOutText}>
              Sign in to delete your account, or email us at {LEGAL_INFO.email} from your
              account address and we’ll remove it for you.
            </Text>
            <Pressable style={[styles.btn, styles.deleteBtn]} onPress={() => router.replace('/login')}>
              <Text style={styles.deleteText}>Sign in</Text>
            </Pressable>
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

  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F6E7E9', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  h1: { fontSize: 20, fontWeight: '800', color: Brand.ink },
  p: { fontSize: 14.5, color: Brand.body, lineHeight: 22, marginTop: 10 },
  subh: { fontSize: 13, fontWeight: '800', color: Brand.ink, marginTop: 22, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  bulletText: { flex: 1, fontSize: 14, color: Brand.body },
  note: { fontSize: 12.5, color: Brand.muted, lineHeight: 18, marginTop: 18 },

  errBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F6E7E9', borderRadius: 10, padding: 10, marginTop: 16 },
  errText: { flex: 1, color: Brand.red, fontSize: 12.5, lineHeight: 17 },

  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  deleteBtn: { backgroundColor: Brand.red, flex: 1 },
  deleteText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { backgroundColor: Brand.surfaceAlt, flex: 1 },
  cancelText: { color: Brand.body, fontWeight: '700', fontSize: 15 },
  confirmRow: { flexDirection: 'row', gap: 12, marginTop: 24 },

  signedOutBox: { marginTop: 24, gap: 14 },
  signedOutText: { fontSize: 14, color: Brand.body, lineHeight: 21 },
});
