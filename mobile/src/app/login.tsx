import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signIn, signUp, signedIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email || !password || (mode === 'signup' && !fullName)) {
      setError('Please fill in all fields.');
      return;
    }
    setBusy(true);
    const res =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim());
    setBusy(false);
    if (res.error) setError(res.error);
  };

  // Once signed in (or in demo mode), leave the login screen for the app.
  if (signedIn) return <Redirect href="/home" />;

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Ionicons name="hammer" size={26} color="#fff" />
            </View>
          </View>
          <Text style={styles.brand}>
            TRINI <Text style={{ color: Brand.ink }}>TRADESMAN</Text>
          </Text>
          <Text style={styles.tag}>FIX IT. TRUST IT.</Text>

          <Text style={styles.title}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </Text>

          {/* Toggle */}
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleBtn, mode === 'signin' && styles.toggleActive]}
              onPress={() => setMode('signin')}>
              <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleActive]}
              onPress={() => setMode('signup')}>
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          {mode === 'signup' && (
            <Field icon="person-outline" placeholder="Full name" value={fullName} onChangeText={setFullName} />
          )}
          <Field
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.primaryBtn} onPress={submit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          {mode === 'signin' ? (
            <Text style={styles.hint}>New here? Tap “Sign Up” above to create an account.</Text>
          ) : (
            <Text style={styles.hint}>
              By signing up you agree to our{' '}
              <Text style={styles.link} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.link} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })}>Privacy Policy</Text>.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  icon,
  ...props
}: { icon: React.ComponentProps<typeof Ionicons>['name'] } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={Brand.muted} />
      <TextInput
        style={styles.input}
        placeholderTextColor={Brand.muted}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 24, paddingTop: 12, flexGrow: 1, justifyContent: 'center' },
  logoRow: { alignItems: 'center', marginBottom: 14 },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { textAlign: 'center', fontSize: 22, fontWeight: '800', color: Brand.red, letterSpacing: 1 },
  tag: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: Brand.muted, letterSpacing: 2, marginTop: 2 },
  title: { fontSize: 22, fontWeight: '800', color: Brand.ink, textAlign: 'center', marginTop: 28, marginBottom: 18 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: Brand.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleActive: { backgroundColor: Brand.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  toggleText: { fontWeight: '700', color: Brand.muted, fontSize: 14 },
  toggleTextActive: { color: Brand.ink },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: Brand.surface,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Brand.ink },

  error: { color: Brand.red, fontSize: 13, marginBottom: 10, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: Brand.red,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  divider: { flex: 1, height: 1, backgroundColor: Brand.line },
  dividerText: { color: Brand.muted, fontSize: 13 },

  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 12,
    paddingVertical: 14,
  },
  ghostBtnText: { color: Brand.body, fontWeight: '700', fontSize: 15 },

  hint: { color: Brand.muted, fontSize: 12, textAlign: 'center', marginTop: 18, lineHeight: 17 },
  link: { color: Brand.red, fontWeight: '700' },
});
