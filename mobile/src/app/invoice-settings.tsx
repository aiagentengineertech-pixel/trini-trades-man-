import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumGateScreen, usePremium } from '@/components/PremiumGate';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { clearWriteError, fetchInvoiceSettings, getLastUploadError, getLastWriteError, saveInvoiceSettings, uploadImage } from '@/lib/db';
import { INVOICE_TEMPLATES } from '@/lib/invoice';
import { pickImage } from '@/lib/images';
import type { InvoiceSettings } from '@/lib/store-types';

const COLORS = ['#E11D26', '#0E1116', '#2F6FED', '#2EA84F', '#E8852B', '#8B5CF6', '#16B1C9', '#9A6B00'];

// Real rendered template previews (hosted on Supabase Storage). Bump V to bust
// the CDN cache after re-rendering a template's artwork.
const PREVIEW_BASE = 'https://bhlflhyojzjzoksejekc.supabase.co/storage/v1/object/public/uploads/theme-assets/previews';
const PREVIEW_V = '2';
const previewUrl = (key: string) => `${PREVIEW_BASE}/${key}.png?v=${PREVIEW_V}`;

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
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewAspect, setPreviewAspect] = useState(0.74);

  useEffect(() => {
    if (userId) fetchInvoiceSettings(userId).then((d) => { if (d) setS(d); });
  }, [userId]);

  const set = (k: keyof InvoiceSettings, v: string | null) => { setS((p) => ({ ...p, [k]: v })); setSaved(false); };

  const chooseLogo = async () => {
    setSaveErr(null);
    const uri = await pickImage();
    if (!uri || !userId) return;
    set('logoUrl', uri);
    setBusy(true);
    // Unique filename so a new logo gets a fresh URL (no stale CDN cache).
    const url = await uploadImage('uploads', `logos/${userId}-${Date.now()}.png`, uri);
    setBusy(false);
    if (url) set('logoUrl', url);
    else setSaveErr(getLastUploadError() ?? 'Logo upload failed.');
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
          <Text style={styles.hint}>Tap a design to preview the full invoice, then choose it.</Text>
          <View style={styles.grid}>
            {INVOICE_TEMPLATES.map((t) => {
              const active = (s.template ?? 'classic') === t.key;
              return (
                <Pressable key={t.key} style={[styles.gCard, active && styles.gCardActive]} onPress={() => setPreviewKey(t.key)}>
                  <Image source={{ uri: previewUrl(t.key) }} style={styles.gImg} contentFit="cover" contentPosition="top" transition={120} />
                  <View style={styles.gMeta}>
                    <Text style={[styles.gName, active && { color: Brand.red }]} numberOfLines={1}>{t.name}</Text>
                    {active && <Ionicons name="checkmark-circle" size={16} color={Brand.red} />}
                  </View>
                  {active && <View style={styles.gBadge}><Ionicons name="checkmark" size={13} color="#fff" /></View>}
                </Pressable>
              );
            })}
          </View>

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

      <Modal visible={!!previewKey} animationType="slide" onRequestClose={() => setPreviewKey(null)}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.topbar}>
            <Pressable onPress={() => setPreviewKey(null)} hitSlop={10}><Ionicons name="close" size={26} color={Brand.ink} /></Pressable>
            <Text style={styles.title}>{INVOICE_TEMPLATES.find((t) => t.key === previewKey)?.name ?? 'Preview'}</Text>
            <View style={{ width: 26 }} />
          </View>
          <ScrollView style={styles.flex} contentContainerStyle={styles.previewScroll} maximumZoomScale={3} minimumZoomScale={1}>
            {previewKey && (
              <Image
                source={{ uri: previewUrl(previewKey) }}
                style={[styles.previewImg, { aspectRatio: previewAspect }]}
                contentFit="contain"
                onLoad={(e) => { const ds = e.source; if (ds?.width && ds?.height) setPreviewAspect(ds.width / ds.height); }}
              />
            )}
          </ScrollView>
          <View style={styles.previewBar}>
            <Pressable
              style={[styles.useBtn, (s.template ?? 'classic') === previewKey && styles.useBtnDone]}
              onPress={() => { if (previewKey) set('template', previewKey); setPreviewKey(null); }}
            >
              <Ionicons name={(s.template ?? 'classic') === previewKey ? 'checkmark-circle' : 'checkmark'} size={18} color="#fff" />
              <Text style={styles.useBtnText}>{(s.template ?? 'classic') === previewKey ? 'Selected — keep this template' : 'Use this template'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
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
  hint: { fontSize: 12.5, color: Brand.muted, marginTop: -4, marginBottom: 12, lineHeight: 17 },
  section: { fontSize: 13, fontWeight: '800', color: Brand.red, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 28 },

  // Template gallery (2-up image grid)
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gCard: { width: '48.5%', borderWidth: 1, borderColor: Brand.line, borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 14 },
  gCardActive: { borderColor: Brand.red, borderWidth: 2 },
  gImg: { width: '100%', height: 168, backgroundColor: '#F4F4F6' },
  gMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 11, paddingVertical: 9 },
  gName: { fontSize: 13, fontWeight: '800', color: Brand.ink, flexShrink: 1 },
  gBadge: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },

  // Full-screen preview
  previewScroll: { padding: 16, paddingBottom: 24, alignItems: 'center' },
  previewImg: { width: '100%', borderRadius: 8, borderWidth: 1, borderColor: Brand.line },
  previewBar: { padding: 16, borderTopWidth: 1, borderTopColor: Brand.line, backgroundColor: '#fff' },
  useBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16 },
  useBtnDone: { backgroundColor: Brand.green },
  useBtnText: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
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
