import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumGateScreen, usePremium } from '@/components/PremiumGate';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { clearWriteError, fetchInvoiceSettings, getLastWriteError, saveInvoiceSettings, uploadImage } from '@/lib/db';
import { INVOICE_TEMPLATES } from '@/lib/invoice';
import { pickImage } from '@/lib/images';
import type { InvoiceSettings } from '@/lib/store-types';

const COLORS = ['#E11D26', '#0E1116', '#2F6FED', '#2EA84F', '#E8852B', '#8B5CF6', '#16B1C9', '#9A6B00'];
const TPL_COLOR: Record<string, string> = { trini: '#EF1B2D', classic: '#E11D26', corporate: '#1F4FC4', noir: '#141414', nexora: '#6B2FB3', monarch: '#1a1a1a', editorial: '#1C2740', woodwork: '#6E4A28' };
const TPL_COLOR2: Record<string, string> = { trini: '#141414', classic: '#7a8089', corporate: '#3A6FE0', noir: '#C9A24B', nexora: '#16A89B', monarch: '#ECECEC', editorial: '#E7B7B5', woodwork: '#E7C9A0' };

export default function InvoiceSettingsScreen() {
  const { userId } = useAuth();
  const [s, setS] = useState<InvoiceSettings>({
    businessName: '', logoUrl: null, brandColor: '#E11D26', taxId: '',
    paymentTerms: 'Payment due within 14 days. Bank transfer or WiPay accepted.',
    footerNote: '', contactPhone: '', contactEmail: '',
    template: 'classic', tagline: '', address: '', website: '',
    bankName: '', bankAccountName: '', bankAccountNumber: '', bankRouting: '', bankSwift: '',
    paymentExtra: '', acceptNote: '', signatureName: '', signatureTitle: '',
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

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
    setSaveErr(null);
    clearWriteError();
    const clean = { ...s, logoUrl: s.logoUrl && !s.logoUrl.startsWith('file') && !s.logoUrl.startsWith('blob') ? s.logoUrl.split('?')[0] : s.logoUrl };
    const ok = await saveInvoiceSettings(userId, clean);
    setBusy(false);
    if (ok) { setSaved(true); }
    else { setSaved(false); setSaveErr(getLastWriteError() ?? 'Could not save. Please try again.'); }
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

          <Text style={styles.label}>Template</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
            {INVOICE_TEMPLATES.map((t) => {
              const active = (s.template ?? 'classic') === t.key;
              return (
                <Pressable key={t.key} style={[styles.tplCard, active && styles.tplCardActive]} onPress={() => set('template', t.key)}>
                  <View style={styles.tplSwatch}>
                    <View style={[styles.tplBar, { backgroundColor: TPL_COLOR[t.key] ?? Brand.red }]} />
                    <View style={[styles.tplBar, { backgroundColor: TPL_COLOR2[t.key] ?? '#111', width: '40%' }]} />
                  </View>
                  <Text style={[styles.tplName, active && { color: Brand.red }]}>{t.name}</Text>
                  <Text style={styles.tplBlurb} numberOfLines={2}>{t.blurb}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={Brand.red} style={styles.tplCheck} />}
                </Pressable>
              );
            })}
          </ScrollView>

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
          <Field label="Tagline" value={s.tagline ?? ''} onChangeText={(v) => set('tagline', v)} placeholder="e.g. Branding & Digital Studio" />
          <Field label="Business address" value={s.address ?? ''} onChangeText={(v) => set('address', v)} placeholder="Street, city, Trinidad & Tobago" multiline />
          <Field label="Website" value={s.website ?? ''} onChangeText={(v) => set('website', v)} placeholder="www.yourbusiness.tt" autoCapitalize="none" />
          <Field label="Payment terms" value={s.paymentTerms} onChangeText={(v) => set('paymentTerms', v)} placeholder="e.g. Due within 14 days…" multiline />
          <Field label="Footer note" value={s.footerNote} onChangeText={(v) => set('footerNote', v)} placeholder="Thank you for your business!" />

          <Text style={styles.section}>Payment details (shown on the invoice)</Text>
          <Field label="Bank name" value={s.bankName ?? ''} onChangeText={(v) => set('bankName', v)} placeholder="e.g. Republic Bank (Trinidad & Tobago)" />
          <Field label="Account name" value={s.bankAccountName ?? ''} onChangeText={(v) => set('bankAccountName', v)} placeholder="Account holder name" />
          <Field label="Account number" value={s.bankAccountNumber ?? ''} onChangeText={(v) => set('bankAccountNumber', v)} placeholder="000000000000" />
          <Field label="Routing / transit" value={s.bankRouting ?? ''} onChangeText={(v) => set('bankRouting', v)} placeholder="(optional)" />
          <Field label="SWIFT / BIC" value={s.bankSwift ?? ''} onChangeText={(v) => set('bankSwift', v)} placeholder="(optional)" autoCapitalize="characters" />
          <Field label="Also accepted" value={s.paymentExtra ?? ''} onChangeText={(v) => set('paymentExtra', v)} placeholder="e.g. PayNow TT (868) 000-0000, PayPal, WiPay" />
          <Field label="We accept (badge)" value={s.acceptNote ?? ''} onChangeText={(v) => set('acceptNote', v)} placeholder="e.g. Bank transfer, WiPay, Credit Card" />

          <Text style={styles.section}>Signature (for templates that show one)</Text>
          <Field label="Signature name" value={s.signatureName ?? ''} onChangeText={(v) => set('signatureName', v)} placeholder="e.g. Alicia Mohammed" />
          <Field label="Signature title" value={s.signatureTitle ?? ''} onChangeText={(v) => set('signatureTitle', v)} placeholder="e.g. Owner / Creative Director" />

          {saved && <View style={styles.savedRow}><Ionicons name="checkmark-circle" size={18} color={Brand.green} /><Text style={styles.savedText}>Branding saved</Text></View>}
          {saveErr && (
            <View style={styles.errRow}>
              <Ionicons name="warning-outline" size={16} color={Brand.red} />
              <Text style={styles.errText}>Couldn’t save: {saveErr}</Text>
            </View>
          )}
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
  section: { fontSize: 13, fontWeight: '800', color: Brand.red, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 28 },
  tplCard: { width: 130, borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 12, backgroundColor: Brand.surface },
  tplCardActive: { borderColor: Brand.red, borderWidth: 2 },
  tplSwatch: { flexDirection: 'row', gap: 3, marginBottom: 10 },
  tplBar: { height: 26, borderRadius: 4, flex: 1 },
  tplName: { fontSize: 14, fontWeight: '800', color: Brand.ink },
  tplBlurb: { fontSize: 11, color: Brand.muted, marginTop: 2, lineHeight: 15 },
  tplCheck: { position: 'absolute', top: 8, right: 8 },
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
  errRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FDECEC', borderRadius: 10, padding: 10, marginTop: 16 },
  errText: { flex: 1, color: Brand.red, fontSize: 12.5, lineHeight: 17 },
  savedText: { color: Brand.green, fontWeight: '700' },
  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
