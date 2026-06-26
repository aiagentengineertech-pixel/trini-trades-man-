import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoverageMap } from '@/components/CoverageMap';
import { FeatureGateScreen, PremiumGateScreen, useFeature, usePremium } from '@/components/PremiumGate';
import { Ambient, Card, SectionTitle } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import {
  addClientPhoto, deleteClient, deleteClientPhoto, fetchClient, fetchClientDocuments, fetchClientExpenses, fetchClientPhotos,
  type SavedInvoice,
} from '@/lib/db';
import { pickImage } from '@/lib/images';
import type { Client, ClientPhoto, Expense } from '@/lib/store-types';

const DOC_LABEL: Record<string, string> = { invoice: 'Invoice', bill: 'Bill', estimate: 'Estimate', quote: 'Quote' };

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const premium = usePremium();
  const crmOn = useFeature('crm');
  const [client, setClient] = useState<Client | null>(null);
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [docs, setDocs] = useState<SavedInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setClient(await fetchClient(id));
    setPhotos(await fetchClientPhotos(id));
    setDocs(await fetchClientDocuments(id));
    setExpenses(await fetchClientExpenses(id));
  }, [id]);

  const income = docs.filter((d) => d.docType === 'invoice' || d.docType === 'bill').reduce((s, d) => s + d.total, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const net = income - spent;
  useEffect(() => { load(); }, [load]);

  const addPhoto = async () => {
    const uri = await pickImage();
    if (!uri || !userId) return;
    setUploading(true);
    await addClientPhoto(userId, id, uri, '');
    setUploading(false);
    setPhotos(await fetchClientPhotos(id));
  };

  const newDoc = (type: string) =>
    router.push({ pathname: '/ai-quote', params: { type, clientId: id, clientName: client?.name ?? '' } });

  const removeClient = async () => { await deleteClient(id); router.back(); };

  if (!premium) return <PremiumGateScreen title="Client" feature="The Client Hub (CRM)" />;
  if (!crmOn) return <FeatureGateScreen title="Client" feature="The Client Hub" />;
  if (!client) {
    return <SafeAreaView style={styles.flex}>
      <Ambient /><Text style={{ padding: 24 }}>Client not found.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title} numberOfLines={1}>{client.name}</Text>
        <Pressable onPress={removeClient} hitSlop={10}><Ionicons name="trash-outline" size={22} color={Brand.muted} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* contact */}
        <Card style={{ padding: 16 }}>
          <Text style={styles.cName}>{client.name}</Text>
          {!!client.area && <Text style={styles.cArea}><Ionicons name="location" size={13} color={Brand.muted} /> {client.area}</Text>}
          <View style={styles.actions}>
            {!!client.phone && (
              <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${client.phone}`)}>
                <Ionicons name="call" size={16} color={Brand.red} /><Text style={styles.actionText}>Call</Text>
              </Pressable>
            )}
            {!!client.phone && (
              <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`)}>
                <Ionicons name="logo-whatsapp" size={16} color={Brand.red} /><Text style={styles.actionText}>WhatsApp</Text>
              </Pressable>
            )}
            {!!client.email && (
              <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${client.email}`)}>
                <Ionicons name="mail" size={16} color={Brand.red} /><Text style={styles.actionText}>Email</Text>
              </Pressable>
            )}
          </View>
          {!!client.notes && <Text style={styles.notes}>{client.notes}</Text>}
        </Card>

        {/* profit strip */}
        {(income > 0 || spent > 0) && (
          <View style={styles.profitRow}>
            <View style={styles.profitCell}><Text style={styles.profitVal}>TT${Math.round(income).toLocaleString()}</Text><Text style={styles.profitLabel}>Billed</Text></View>
            <View style={styles.profitCell}><Text style={styles.profitVal}>TT${Math.round(spent).toLocaleString()}</Text><Text style={styles.profitLabel}>Spent</Text></View>
            <View style={styles.profitCell}><Text style={[styles.profitVal, { color: net >= 0 ? Brand.green : Brand.red }]}>TT${Math.round(net).toLocaleString()}</Text><Text style={styles.profitLabel}>Net</Text></View>
          </View>
        )}

        {/* site map */}
        {client.lat != null && client.lng != null && (
          <View style={{ marginTop: 16 }}>
            <SectionTitle title="Site location" />
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <CoverageMap lat={client.lat} lng={client.lng} radiusKm={1.5} height={150} />
            </Card>
          </View>
        )}

        {/* documents */}
        <View style={{ marginTop: 16 }}>
          <SectionTitle title="Estimates & invoices" />
          <View style={styles.docBtns}>
            <Pressable style={styles.docBtn} onPress={() => newDoc('estimate')}><Ionicons name="document-outline" size={15} color={Brand.red} /><Text style={styles.docBtnText}>New estimate</Text></Pressable>
            <Pressable style={styles.docBtn} onPress={() => newDoc('invoice')}><Ionicons name="document-text-outline" size={15} color={Brand.red} /><Text style={styles.docBtnText}>New invoice</Text></Pressable>
          </View>
          <Pressable style={styles.logExpBtn} onPress={() => router.push({ pathname: '/expenses', params: { clientId: id } })}>
            <Ionicons name="receipt-outline" size={15} color={Brand.body} />
            <Text style={styles.logExpText}>Log an expense for this client</Text>
          </Pressable>
          {docs.length === 0 ? (
            <Text style={styles.emptyLine}>No documents yet for this client.</Text>
          ) : (
            <View style={{ gap: 8, marginTop: 10 }}>
              {docs.map((d) => (
                <Pressable key={d.id} onPress={() => router.push({ pathname: '/doc/[id]', params: { id: d.id } })}>
                  <Card style={styles.docRow}>
                    <View style={styles.grow}>
                      <Text style={styles.docTitle}>{DOC_LABEL[d.docType]} · {d.number}</Text>
                      <Text style={styles.docMeta}>{d.signedAt ? 'Approved' : d.convertedTo ? 'Converted' : 'Sent'} · {d.createdAt}</Text>
                    </View>
                    <Text style={styles.docTotal}>TT${d.total.toLocaleString()}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* photo vault */}
        <View style={{ marginTop: 20 }}>
          <SectionTitle title="Project photos" action="Add" onAction={addPhoto} />
          {photos.length === 0 ? (
            <Pressable style={styles.addPhoto} onPress={addPhoto}>
              <Ionicons name="camera-outline" size={22} color={Brand.muted} />
              <Text style={styles.addPhotoText}>{uploading ? 'Uploading…' : 'Add before/after photos'}</Text>
            </Pressable>
          ) : (
            <View style={styles.grid}>
              {photos.map((p) => (
                <Pressable key={p.id} style={styles.photoWrap} onLongPress={async () => { await deleteClientPhoto(p.id); setPhotos(await fetchClientPhotos(id)); }}>
                  <Image source={{ uri: p.url }} style={styles.photo} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Brand.ink, marginHorizontal: 8 },
  grow: { flex: 1 },

  profitRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  profitCell: { flex: 1, backgroundColor: Brand.surface, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  profitVal: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  profitLabel: { fontSize: 11, color: Brand.muted, marginTop: 2 },
  logExpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.line, borderRadius: 12, paddingVertical: 12, marginTop: 10 },
  logExpText: { color: Brand.body, fontWeight: '600', fontSize: 13 },

  cName: { fontSize: 18, fontWeight: '800', color: Brand.ink },
  cArea: { fontSize: 13, color: Brand.muted, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: Brand.red, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { color: Brand.red, fontWeight: '700', fontSize: 13 },
  notes: { fontSize: 13, color: Brand.body, marginTop: 14, lineHeight: 19 },

  docBtns: { flexDirection: 'row', gap: 10 },
  docBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingVertical: 12 },
  docBtnText: { color: Brand.red, fontWeight: '700', fontSize: 13 },
  emptyLine: { fontSize: 13, color: Brand.muted, marginTop: 12 },
  docRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  docTitle: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  docMeta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  docTotal: { fontSize: 15, fontWeight: '800', color: Brand.ink },

  addPhoto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.line, borderRadius: 14, paddingVertical: 22 },
  addPhotoText: { color: Brand.muted, fontWeight: '600', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrap: { width: '31.5%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: Brand.surfaceAlt },
  photo: { width: '100%', height: '100%' },
});
