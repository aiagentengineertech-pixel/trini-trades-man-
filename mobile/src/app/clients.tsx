import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AreaPicker } from '@/components/AreaPicker';
import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Ambient, Card } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchClients, saveClient } from '@/lib/db';
import type { Client } from '@/lib/store-types';

export default function ClientsScreen() {
  const { userId } = useAuth();
  const premium = usePremium();
  const crmOn = useFeature('crm');
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => { if (userId) setClients(await fetchClients(userId)); }, [userId]);
  useEffect(() => { load(); }, [load]);

  if (!premium) return <PremiumGateScreen title="Clients" feature="The Client Hub (CRM)" />;
  if (!crmOn) return <FeatureGateScreen title="Clients" feature="The Client Hub" />;

  const q = query.trim().toLowerCase();
  const list = clients.filter((c) => !q || c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q));

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Clients</Text>
        <Pressable onPress={() => setOpen(true)} hitSlop={10}><Ionicons name="person-add" size={24} color={Brand.red} /></Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={Brand.muted} />
        <TextInput placeholder="Search clients…" placeholderTextColor={Brand.muted} style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={Brand.muted} />
            <Text style={styles.emptyText}>{clients.length === 0 ? 'No clients yet.' : 'No matches.'}</Text>
            {clients.length === 0 && <Pressable style={styles.emptyBtn} onPress={() => setOpen(true)}><Text style={styles.emptyBtnText}>Add your first client</Text></Pressable>}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {list.map((c) => (
              <Pressable key={c.id} onPress={() => router.push({ pathname: '/client/[id]', params: { id: c.id } })}>
                <Card style={styles.row}>
                  <View style={styles.avatar}><Text style={styles.initial}>{c.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={styles.grow}>
                    <Text style={styles.name}>{c.name}</Text>
                    <Text style={styles.meta}>{[c.area, c.phone].filter(Boolean).join(' · ') || 'No contact info'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {open && <ClientEditor userId={userId!} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
    </SafeAreaView>
  );
}

function ClientEditor({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await saveClient(userId, { name: name.trim(), phone, email, area, lat: coords?.lat ?? null, lng: coords?.lng ?? null, notes });
    setBusy(false);
    onSaved();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
      <Ambient />
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>New client</Text>
              <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={Brand.ink} /></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.flabel}>Name</Text>
              <TextInput style={styles.input} placeholder="Client / company name" placeholderTextColor={Brand.muted} value={name} onChangeText={setName} />
              <Text style={styles.flabel}>Phone</Text>
              <TextInput style={styles.input} placeholder="+1 (868) 000-0000" placeholderTextColor={Brand.muted} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <Text style={styles.flabel}>Email</Text>
              <TextInput style={styles.input} placeholder="client@email.com" placeholderTextColor={Brand.muted} autoCapitalize="none" value={email} onChangeText={setEmail} />
              <Text style={styles.flabel}>Site location</Text>
              <AreaPicker area={area} onChange={(v) => { setArea(v.area); setCoords({ lat: v.lat, lng: v.lng }); }} placeholder="Pin the job site" />
              <Text style={styles.flabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textarea]} placeholder="Gate code, preferred times, etc." placeholderTextColor={Brand.muted} value={notes} onChangeText={setNotes} multiline />
              <Pressable style={styles.saveBtn} onPress={save} disabled={busy}>
                <Text style={styles.saveBtnText}>{busy ? 'Saving…' : 'Save client'}</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  grow: { flex: 1 },

  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, marginHorizontal: 20 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Brand.ink },

  empty: { alignItems: 'center', gap: 12, paddingVertical: 50 },
  emptyText: { fontSize: 14, color: Brand.muted },
  emptyBtn: { backgroundColor: Brand.red, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.redSoft, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 18, fontWeight: '800', color: Brand.red },
  name: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, maxHeight: '88%' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.line, marginBottom: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink },
  flabel: { fontSize: 13, fontWeight: '700', color: Brand.ink, marginTop: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Brand.ink },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
