import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { Card } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { addPortfolioItem, deletePortfolioItem, fetchPortfolio } from '@/lib/db';
import { pickImage } from '@/lib/images';
import type { PortfolioItem } from '@/lib/store-types';

export default function PortfolioScreen() {
  const { userId } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (userId) fetchPortfolio(userId).then(setItems);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setError(null);
    if (!title.trim()) { setError('Give the project a title.'); return; }
    if (!userId) return;
    setBusy(true);
    const ok = await addPortfolioItem(userId, {
      title: title.trim(),
      value: value ? Number(value) : undefined,
      beforeUri: before,
      afterUri: after,
    });
    setBusy(false);
    if (!ok) { setError('Could not save. Try again.'); return; }
    setTitle(''); setValue(''); setBefore(null); setAfter(null);
    load();
  };

  const remove = async (id: string) => {
    setItems((p) => p.filter((x) => x.id !== id));
    await deletePortfolioItem(id);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>My Portfolio</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {/* Add a project */}
          <Card>
            <Text style={styles.cardTitle}>Add a project</Text>
            <TextInput style={styles.input} placeholder="Project title (e.g. Kitchen rewire)" placeholderTextColor={Brand.muted} value={title} onChangeText={setTitle} />
            <View style={styles.amountField}>
              <Text style={styles.currency}>TT$</Text>
              <TextInput style={styles.amountInput} placeholder="Project value (optional)" placeholderTextColor={Brand.muted} keyboardType="numeric" value={value} onChangeText={setValue} />
            </View>
            <View style={styles.photoRow}>
              <PhotoPicker label="Before" uri={before} onPick={async () => { const u = await pickImage(); if (u) setBefore(u); }} />
              <PhotoPicker label="After" uri={after} onPick={async () => { const u = await pickImage(); if (u) setAfter(u); }} />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.addBtn} onPress={add} disabled={busy}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>{busy ? 'Saving…' : 'Add to portfolio'}</Text>
            </Pressable>
          </Card>

          {/* Existing projects */}
          <Text style={styles.section}>Your projects ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.empty}>No projects yet. Add your best work above — it shows on your public profile.</Text>
          ) : (
            <View style={{ gap: 14 }}>
              {items.map((p) => (
                <Card key={p.id} style={{ padding: 0, overflow: 'hidden' }}>
                  <View style={styles.ba}>
                    <View style={styles.baHalf}>
                      {p.beforeUrl ? <Image source={{ uri: p.beforeUrl }} style={styles.baImg} contentFit="cover" /> : <View style={[styles.baImg, styles.baEmpty]}><Ionicons name="image-outline" size={24} color={Brand.muted} /></View>}
                      <View style={styles.baTag}><Text style={styles.baTagText}>BEFORE</Text></View>
                    </View>
                    <View style={styles.baHalf}>
                      {p.afterUrl ? <Image source={{ uri: p.afterUrl }} style={styles.baImg} contentFit="cover" /> : <View style={[styles.baImg, styles.baEmpty]}><Ionicons name="image-outline" size={24} color={Brand.muted} /></View>}
                      <View style={[styles.baTag, { backgroundColor: Brand.green }]}><Text style={styles.baTagText}>AFTER</Text></View>
                    </View>
                  </View>
                  <View style={styles.pInfo}>
                    <View style={styles.flex}>
                      <Text style={styles.pTitle}>{p.title}</Text>
                      {!!p.value && <Text style={styles.pValue}>{p.value}</Text>}
                    </View>
                    <Pressable hitSlop={8} onPress={() => remove(p.id)}>
                      <Ionicons name="trash-outline" size={20} color={Brand.red} />
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PhotoPicker({ label, uri, onPick }: { label: string; uri: string | null; onPick: () => void }) {
  return (
    <Pressable style={styles.picker} onPress={onPick}>
      {uri ? (
        <Image source={{ uri }} style={styles.pickerImg} contentFit="cover" />
      ) : (
        <>
          <Ionicons name="camera-outline" size={22} color={Brand.muted} />
          <Text style={styles.pickerLabel}>{label} photo</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  cardTitle: { fontSize: 16, fontWeight: '800', color: Brand.ink, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Brand.ink, marginBottom: 10 },
  amountField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12 },
  currency: { fontSize: 15, fontWeight: '700', color: Brand.muted },
  amountInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: Brand.ink },

  photoRow: { flexDirection: 'row', gap: 12 },
  picker: { flex: 1, height: 110, borderRadius: 12, borderWidth: 1, borderColor: Brand.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  pickerImg: { width: '100%', height: '100%' },
  pickerLabel: { fontSize: 12, color: Brand.muted, fontWeight: '600' },

  error: { color: Brand.red, fontWeight: '600', marginTop: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.red, borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  section: { fontSize: 14, fontWeight: '800', color: Brand.ink, marginTop: 24, marginBottom: 12 },
  empty: { fontSize: 13, color: Brand.muted, lineHeight: 19 },

  ba: { flexDirection: 'row', height: 130 },
  baHalf: { flex: 1 },
  baImg: { width: '100%', height: '100%' },
  baEmpty: { backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  baTag: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(14,17,22,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  baTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  pInfo: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  pTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  pValue: { fontSize: 13, fontWeight: '800', color: Brand.red, marginTop: 4 },
});
