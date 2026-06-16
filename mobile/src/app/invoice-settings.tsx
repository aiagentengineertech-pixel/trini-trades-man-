import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumGateScreen, usePremium } from '@/components/PremiumGate';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchInvoiceSettings, saveInvoiceSettings, uploadImage } from '@/lib/db';
import { pickImage } from '@/lib/images';
import type { InvoiceSettings } from '@/lib/store-types';

const COLORS = ['#E11D26', '#0E1116', '#2F6FED', '#2EA84F', '#E8852B', '#8B5CF6', '#16B1C9', '#9A6B00'];

export default function InvoiceSettingsScreen() {
  const { userId } = useAuth();
  const [s, setS] = useState<InvoiceSettings>({
    businessName: '', logoUrl: null, brandColor: '#E11D26', taxId: '',
    paymentTerms: 'Payment due within 14 days. Bank transfer or WiPay accepted.',
    footerNote: '', contactPhone: '', contactEmail: '',
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userId) fetchInvoiceSettings(userId).then((d) => { if (d) setS(d); });
  }, [userId]);

  const set = (k: keyof InvoiceSettings, v: string | null) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };

  const chooseLogo = async () => {
    const uri = await pickImage();
    if (!uri || !userId) return;
    set('logoUrl', uri);
    setBusy(true);
    const url = await uploadImage('uploads', `logos/${userId}.png`, uri);
    setBusy(false);
    if (url) set('logoUrl', url + '?t=' + Date.now());
  };

  const premium = usePremium();

  const save = async () => {
    if (!userId) return;
    setBusy(true);
    const clean = { ...s, logoUrl: s.logoUrl && !s.logoUrl.startsWith('file') && !s.logoUrl.startsWith('blob') ? s.logoUrl.split('?')[0] : s.logoUrl };
    const ok = await saveInvoiceSettings(userId, clean);
    setBusy(false);
    setSaved(ok);
  };

  if (!premium) return <PremiumGateScreen title="Invoice Branding" feature="Custom invoice branding (logo, colours, payment terms)" />;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Invoice Branding</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>This branding appears on every invoice and quote PDF you generate.</Text>

          <Text style={styles.label}>Company logo</Text>
          <Pressable style={styles.logoBox} onPress={chooseLogo}>
            {s.logoUrl ? (
              <Image source={{ uri: s.logoUrl }} style={styles.logoImg} contentFit="contain" />
            ) : (
              <View style={styles.logoEmpty}>
                <Ionicons name="image-outline" size={26} color={Brand.muted} />
                <Text style={styles.logoHint}>Tap to upload your logo</Text>
              </View>
            )}
          </Pressable>

          <Field label="Business name" value={s.businessName} onChangeText={(v) => set('businessName', v)} placeholder="e.g. Ramlal Electrical Ltd" />

          <Text style={styles.label}>Brand colour</Text>
          <View style={styles.swatches}>
            {COLORS.map((c) => (
              <Pressable key={c} onPress={() => set('brandColor', c)} style={[styles.swatch, { backgroundColor: c }, s.brandColor === c && styles.swatchActive]}>
                {s.brandColor === c && <Ionicons name="checkmark" size={16} color="#fff" />}
              </Pressable>
            ))}
          </View>

          <Field label="Tax / BIR number" value={s.taxId} onChangeText={(v) => set('taxId', v)} placeholder="VAT / BIR registration #" />
          <Field label="Contact phone" value={s.contactPhone} onChangeText={(v) => set('contactPhone', v)} placeholder="+1 (868) 000-0000" keyboardType="phone-pad" />
          <Field label="Contact email" value={s.contactEmail} onChangeText={(v) => set('contactEmail', v)} placeholder="you@business.com" autoCapitalize="none" />
          <Field label="Payment terms" value={s.paymentTerms} onChangeText={(v) => set('paymentTerms', v)} placeholder="e.g. Due within 14 days…" multiline />
          <Field label="Footer note" value={s.footerNote} onChangeText={(v) => set('footerNote', v)} placeholder="Thank you for your business!" />

          {saved && <View style={styles.savedRow}><Ionicons name="checkmark-circle" size={18} color={Brand.green} /><Text style={styles.savedText}>Branding saved</Text></View>}
          <Pressable style={styles.saveBtn} onPress={save} disabled={busy}>
            <Text style={styles.saveBtnText}>{busy ? 'Saving…' : 'Save branding'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, multiline, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, multiline && styles.textarea]} placeholderTextColor={Brand.muted} multiline={multiline} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  intro: { fontSize: 13, color: Brand.muted, lineHeight: 19 },

  label: { fontSize: 14, fontWeight: '700', color: Brand.ink, marginTop: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Brand.ink },
  textarea: { minHeight: 72, textAlignVertical: 'top' },

  logoBox: { borderWidth: 1, borderColor: Brand.line, borderStyle: 'dashed', borderRadius: 14, height: 110, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: '90%', height: '80%' },
  logoEmpty: { alignItems: 'center', gap: 6 },
  logoHint: { fontSize: 13, color: Brand.muted },

  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  swatchActive: { borderWidth: 3, borderColor: 'rgba(0,0,0,0.15)' },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  savedText: { color: Brand.green, fontWeight: '700' },
  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
