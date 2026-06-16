import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented } from '@/components/ui';
import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { addCatalogItem, deleteCatalogItem, fetchCatalog, updateCatalogItem } from '@/lib/db';
import type { CatalogItem } from '@/lib/store-types';

export default function CatalogScreen() {
  const { userId } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => { if (userId) setItems(await fetchCatalog(userId)); }, [userId]);
  useEffect(() => { load(); }, [load]);

  const premium = usePremium();
  const catalogOn = useFeature('catalog');
  const q = query.trim().toLowerCase();
  const list = items.filter((i) => !q || i.name.toLowerCase().includes(q));

  if (!premium) return <PremiumGateScreen title="Price Book" feature="Your saved services & materials price book" />;
  if (!catalogOn) return <FeatureGateScreen title="Price Book" feature="The price book" />;

  const openNew = () => { setEditing({ id: '', name: '', kind: 'service', unit: 'job', price: 0 }); setOpen(true); };
  const openEdit = (it: CatalogItem) => { setEditing(it); setOpen(true); };

  const onSaved = async () => { setOpen(false); setEditing(null); await load(); };
  const remove = async (id: string) => { await deleteCatalogItem(id); load(); };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Price Book</Text>
        <Pressable onPress={openNew} hitSlop={10}><Ionicons name="add" size={26} color={Brand.red} /></Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={Brand.muted} />
        <TextInput placeholder="Search services & materials…" placeholderTextColor={Brand.muted} style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.hint}>Save the services and materials you quote often, with set prices — then add them to invoices in a tap.</Text>
        {list.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="pricetags-outline" size={32} color={Brand.muted} />
            <Text style={styles.emptyText}>{items.length === 0 ? 'No saved items yet.' : 'No matches.'}</Text>
            {items.length === 0 && <Pressable style={styles.emptyBtn} onPress={openNew}><Text style={styles.emptyBtnText}>Add your first item</Text></Pressable>}
          </View>
        )}
        <View style={{ gap: 10, marginTop: 12 }}>
          {list.map((it) => (
            <Card key={it.id} style={styles.row}>
              <View style={[styles.kindIcon, it.kind === 'material' && { backgroundColor: '#EAF1FE' }]}>
                <Ionicons name={it.kind === 'material' ? 'cube-outline' : 'construct-outline'} size={18} color={it.kind === 'material' ? '#2F6FED' : Brand.red} />
              </View>
              <Pressable style={styles.grow} onPress={() => openEdit(it)}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemMeta}>{it.kind === 'material' ? 'Material' : 'Service'}{it.unit ? ` · per ${it.unit}` : ''}</Text>
              </Pressable>
              <Text style={styles.price}>TT${it.price.toLocaleString()}</Text>
              <Pressable onPress={() => remove(it.id)} hitSlop={8} style={{ marginLeft: 10 }}><Ionicons name="trash-outline" size={18} color={Brand.muted} /></Pressable>
            </Card>
          ))}
        </View>
      </ScrollView>

      {open && editing && (
        <ItemEditor userId={userId!} item={editing} onClose={() => { setOpen(false); setEditing(null); }} onSaved={onSaved} />
      )}
    </SafeAreaView>
  );
}

function ItemEditor({ userId, item, onClose, onSaved }: { userId: string; item: CatalogItem; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(item.name);
  const [kind, setKind] = useState(item.kind === 'material' ? 'Material' : 'Service');
  const [unit, setUnit] = useState(item.unit);
  const [price, setPrice] = useState(item.price ? String(item.price) : '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const payload = { name: name.trim(), kind: (kind === 'Material' ? 'material' : 'service') as CatalogItem['kind'], unit: unit.trim(), price: Number(price) || 0 };
    if (item.id) await updateCatalogItem(item.id, payload);
    else await addCatalogItem(userId, payload);
    setBusy(false);
    onSaved();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{item.id ? 'Edit item' : 'New item'}</Text>
              <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={Brand.ink} /></Pressable>
            </View>
            <Text style={styles.flabel}>Type</Text>
            <Segmented options={['Service', 'Material']} value={kind} onChange={setKind} />
            <Text style={styles.flabel}>Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Standard toilet install" placeholderTextColor={Brand.muted} value={name} onChangeText={setName} />
            <View style={styles.rowFields}>
              <View style={styles.grow}>
                <Text style={styles.flabel}>Price (TTD)</Text>
                <TextInput style={styles.input} placeholder="350" placeholderTextColor={Brand.muted} keyboardType="numeric" value={price} onChangeText={setPrice} />
              </View>
              <View style={styles.grow}>
                <Text style={styles.flabel}>Unit</Text>
                <TextInput style={styles.input} placeholder="job / ft / hr" placeholderTextColor={Brand.muted} value={unit} onChangeText={setUnit} />
              </View>
            </View>
            <Pressable style={styles.saveBtn} onPress={save} disabled={busy}>
              <Text style={styles.saveBtnText}>{busy ? 'Saving…' : 'Save item'}</Text>
            </Pressable>
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

  hint: { fontSize: 13, color: Brand.muted, lineHeight: 19 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 14, color: Brand.muted },
  emptyBtn: { backgroundColor: Brand.red, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  kindIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: Brand.redSoft, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  itemMeta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: Brand.ink },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.line, marginBottom: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink },
  flabel: { fontSize: 13, fontWeight: '700', color: Brand.ink, marginTop: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Brand.ink },
  rowFields: { flexDirection: 'row', gap: 12 },
  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
