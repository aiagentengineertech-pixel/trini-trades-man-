import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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

import { Image } from 'expo-image';
import type { Href } from 'expo-router';

import { Card, SectionTitle, type IconName } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { pickImages } from '@/lib/images';
import { notifyLocal } from '@/lib/notifications';
import { useStore } from '@/lib/store';

const TRADES = ['Electrician', 'Plumbing', 'AC Repair', 'Carpentry', 'Painting', 'Masonry'];

export default function PostTab() {
  const { role } = useAuth();
  return role === 'tradesman' ? <BusinessHub /> : <CustomerPost />;
}

const HUB: { icon: IconName; label: string; desc: string; route: Href; tint: string; bg: string }[] = [
  { icon: 'cash-outline', label: 'Earnings', desc: 'Revenue & payouts', route: '/earnings', tint: '#2EA84F', bg: '#E9F8EE' },
  { icon: 'wallet-outline', label: 'Wallet', desc: 'Balance & withdraw', route: '/wallet', tint: '#E11D26', bg: '#FDECEC' },
  { icon: 'document-text-outline', label: 'Quotes', desc: 'Manage quotes', route: '/quotes', tint: '#2F6FED', bg: '#EAF1FE' },
  { icon: 'briefcase-outline', label: 'Jobs', desc: 'Active & completed', route: '/jobs-manage', tint: '#E8852B', bg: '#FDF1E6' },
  { icon: 'stats-chart-outline', label: 'Analytics', desc: 'Views & conversion', route: '/analytics', tint: '#8B5CF6', bg: '#F1ECFE' },
  { icon: 'people-outline', label: 'Team', desc: 'Staff & roles', route: '/analytics', tint: '#16B1C9', bg: '#E6F8FB' },
];

function BusinessHub() {
  const { myBids } = useStore();
  const wins = myBids().filter((b) => b.status === 'accepted').length;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.hubTitle}>Business</Text>
        <Text style={styles.subtitle}>Manage your work, earnings and growth.</Text>

        {/* Earnings snapshot */}
        <Pressable onPress={() => router.push('/earnings')}>
          <Card style={styles.snapshot}>
            <View style={styles.snapHeader}>
              <Text style={styles.snapLabel}>Earnings this month</Text>
              <View style={styles.snapTrend}>
                <Ionicons name="trending-up" size={14} color="#fff" />
                <Text style={styles.snapTrendText}>+18%</Text>
              </View>
            </View>
            <Text style={styles.snapValue}>TT$4,250</Text>
            <View style={styles.snapRow}>
              <Text style={styles.snapMeta}>Pending escrow: TT$1,800</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
            </View>
          </Card>
        </Pressable>

        {/* Hub grid */}
        <View style={styles.gridWrap}>
          {HUB.map((h) => (
            <Pressable key={h.label} style={styles.hubCard} onPress={() => router.push(h.route)}>
              <View style={[styles.hubIcon, { backgroundColor: h.bg }]}>
                <Ionicons name={h.icon} size={22} color={h.tint} />
              </View>
              <Text style={styles.hubLabel}>{h.label}</Text>
              <Text style={styles.hubDesc}>{h.desc}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle title="Today" />
        <Card style={{ paddingVertical: 4 }}>
          <View style={styles.todayRow}>
            <Ionicons name="briefcase" size={18} color={Brand.body} />
            <Text style={styles.todayText}>2 active jobs in progress</Text>
          </View>
          <View style={[styles.todayRow, styles.todayDivider]}>
            <Ionicons name="document-text" size={18} color={Brand.body} />
            <Text style={styles.todayText}>{wins} quote{wins === 1 ? '' : 's'} accepted</Text>
          </View>
          <View style={styles.todayRow}>
            <Ionicons name="chatbubble-ellipses" size={18} color={Brand.body} />
            <Text style={styles.todayText}>3 new messages</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function CustomerPost() {
  const { addJob } = useStore();
  const [trade, setTrade] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [postedId, setPostedId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = async () => {
    const uris = await pickImages();
    if (uris.length) setPhotos((p) => [...p, ...uris].slice(0, 6));
  };

  const reset = () => {
    setTrade(null);
    setTitle('');
    setDescription('');
    setBudgetMin('');
    setBudgetMax('');
    setPostedId(null);
    setPhotos([]);
    setError(null);
  };

  const submit = () => {
    setError(null);
    if (!trade || !title.trim()) {
      setError('Pick a trade and add a short title.');
      return;
    }
    const id = addJob({
      title: title.trim(),
      trade,
      description: description.trim(),
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
    });
    setPostedId(id);
    notifyLocal('Job posted ✅', `Verified ${trade.toLowerCase()} tradesmen near you are being notified.`);
  };

  if (postedId) {
    return (
      <SafeAreaView style={[styles.flex, styles.center]} edges={['top']}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={44} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Job posted!</Text>
        <Text style={styles.successSub}>
          Verified {trade?.toLowerCase()} tradesmen near you are being notified. Quotes will start
          coming in shortly.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            const id = postedId;
            reset();
            router.push({ pathname: '/job/[id]', params: { id } });
          }}>
          <Text style={styles.primaryBtnText}>View job & quotes</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={reset}>
          <Text style={styles.secondaryBtnText}>Post another job</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Post a Job</Text>
          <Text style={styles.subtitle}>Describe what you need and get quotes from verified pros.</Text>

          <Text style={styles.label}>What type of work?</Text>
          <View style={styles.tradeGrid}>
            {TRADES.map((t) => (
              <Pressable key={t} onPress={() => setTrade(t)} style={[styles.tradeChip, trade === t && styles.tradeChipActive]}>
                <Text style={[styles.tradeChipText, trade === t && styles.tradeChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Job title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Install ceiling fan in bedroom"
            placeholderTextColor={Brand.muted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Details</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the job, location notes, timing…"
            placeholderTextColor={Brand.muted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Budget range (TTD, optional)</Text>
          <View style={styles.budgetRow}>
            <View style={[styles.input, styles.budgetField]}>
              <Text style={styles.currency}>$</Text>
              <TextInput style={styles.budgetInput} placeholder="Min" placeholderTextColor={Brand.muted} keyboardType="numeric" value={budgetMin} onChangeText={setBudgetMin} />
            </View>
            <View style={[styles.input, styles.budgetField]}>
              <Text style={styles.currency}>$</Text>
              <TextInput style={styles.budgetInput} placeholder="Max" placeholderTextColor={Brand.muted} keyboardType="numeric" value={budgetMax} onChangeText={setBudgetMax} />
            </View>
          </View>

          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 14 }}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                  <Pressable style={styles.thumbX} onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
          <Pressable style={styles.photoBtn} onPress={addPhotos}>
            <Ionicons name="camera-outline" size={20} color={Brand.body} />
            <Text style={styles.photoBtnText}>{photos.length ? 'Add more photos' : 'Add photos'}</Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.primaryBtn} onPress={submit}>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Post Job & Get Quotes</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  content: { padding: 20, paddingBottom: 100 },
  h1: { fontSize: 26, fontWeight: '800', color: Brand.ink },
  subtitle: { fontSize: 14, color: Brand.muted, marginTop: 4, marginBottom: 8 },

  label: { fontSize: 14, fontWeight: '700', color: Brand.ink, marginTop: 20, marginBottom: 10 },
  tradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tradeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Brand.line, backgroundColor: Brand.surface },
  tradeChipActive: { backgroundColor: Brand.red, borderColor: Brand.red },
  tradeChipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  tradeChipTextActive: { color: '#fff' },

  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Brand.ink, backgroundColor: Brand.surface },
  textarea: { minHeight: 100, textAlignVertical: 'top' },

  budgetRow: { flexDirection: 'row', gap: 12 },
  budgetField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 0 },
  currency: { fontSize: 15, color: Brand.muted, fontWeight: '700' },
  budgetInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: Brand.ink },

  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Brand.line, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16, marginTop: 14 },
  photoBtnText: { color: Brand.body, fontWeight: '600', fontSize: 14 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: Brand.surfaceAlt },
  thumbX: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: Brand.ink, alignItems: 'center', justifyContent: 'center' },

  error: { color: Brand.red, fontWeight: '600', marginTop: 16 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, marginTop: 24 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  secondaryBtnText: { color: Brand.muted, fontWeight: '700', fontSize: 14 },

  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Brand.green, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Brand.ink },
  successSub: { fontSize: 15, color: Brand.muted, textAlign: 'center', marginTop: 8, lineHeight: 21 },

  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bidRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Brand.line },
  bidIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bidJob: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  bidMeta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  bidAmount: { fontSize: 13, fontWeight: '700', color: Brand.red, marginTop: 6 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: Brand.surfaceAlt },
  statusAccepted: { backgroundColor: Brand.green },
  statusRejected: { backgroundColor: Brand.muted },
  statusTagText: { fontSize: 12, fontWeight: '700', color: Brand.body },

  hubTitle: { fontSize: 28, fontWeight: '800', color: Brand.ink, letterSpacing: -0.5 },
  snapshot: { backgroundColor: Brand.red, borderColor: Brand.red, marginTop: 18, marginBottom: 18 },
  snapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  snapLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  snapTrend: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  snapTrendText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  snapValue: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
  snapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  snapMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  hubCard: { width: '47%', flexGrow: 1, backgroundColor: Brand.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#0E1116', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  hubIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  hubLabel: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  hubDesc: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  todayDivider: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  todayText: { fontSize: 14, color: Brand.ink, fontWeight: '500' },
});
