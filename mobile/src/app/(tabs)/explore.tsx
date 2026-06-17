import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProAvatar } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

export default function ExploreScreen() {
  const { pros, distanceKm, distanceLabel, trades } = useStore();
  const CATEGORIES = ['All', ...trades];
  const { trade } = useLocalSearchParams<{ trade?: string }>();
  const [active, setActive] = useState(trade || 'All');
  const [query, setQuery] = useState('');

  // Apply the trade filter when arriving from a service tap on Home.
  useEffect(() => {
    if (trade) setActive(trade);
  }, [trade]);
  const q = query.trim().toLowerCase();
  const list = pros
    .filter(
      (p) => {
        const services = p.services?.length ? p.services : [p.trade];
        return (active === 'All' || services.includes(active)) &&
          (!q || p.name.toLowerCase().includes(q) || services.some((s) => s.toLowerCase().includes(q)) || p.area.toLowerCase().includes(q));
      },
    )
    .sort((a, b) => {
      const da = distanceKm(a.lat, a.lng);
      const db = distanceKm(b.lat, b.lng);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>Find a Pro</Text>
        <View style={styles.searchField}>
          <Ionicons name="search" size={18} color={Brand.muted} />
          <TextInput
            placeholder="Search tradesmen…"
            placeholderTextColor={Brand.muted}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Brand.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setActive(c)} style={[styles.chip, active === c && styles.chipActive]}>
              <Text style={[styles.chipText, active === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.count}>{list.length} tradesmen near you</Text>

        {list.length === 0 && (
          <View style={{ alignItems: 'center', paddingHorizontal: 30, paddingVertical: 50 }}>
            <Ionicons name="people-outline" size={40} color={Brand.muted} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: Brand.ink, marginTop: 14 }}>No tradesmen yet</Text>
            <Text style={{ fontSize: 13, color: Brand.muted, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>
              Tradesmen who sign up and set their trade will appear here. Are you a pro? Switch to tradesman mode in Profile → Settings.
            </Text>
          </View>
        )}

        {list.map((p) => (
          <Pressable key={p.id} style={styles.card} onPress={() => router.push({ pathname: '/pro/[id]', params: { id: p.id } })}>
            <ProAvatar photoUrl={p.photoUrl} icon={p.icon} color={p.color} bg={p.bg} iconSize={26} style={styles.avatar} />
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{p.name}</Text>
                {p.verified && <Ionicons name="shield-checkmark" size={14} color={Brand.green} />}
              </View>
              <Text style={styles.trade}>{(p.services?.length ? p.services.slice(0, 3).join(', ') : p.trade)} · {p.area}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={13} color={Brand.star} />
                <Text style={styles.meta}>{p.reviewsCount > 0 ? p.rating.toFixed(1) : 'New'}</Text>
                {distanceLabel(p.lat, p.lng) && <Text style={styles.metaDim}>· {distanceLabel(p.lat, p.lng)}</Text>}
              </View>
            </View>
            <View style={styles.cta}><Text style={styles.ctaText}>View</Text></View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  headerWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  h1: { fontSize: 26, fontWeight: '800', color: Brand.ink, marginBottom: 14 },
  searchField: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.surfaceAlt, borderRadius: 12, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Brand.ink },

  chips: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Brand.surfaceAlt },
  chipActive: { backgroundColor: Brand.red },
  chipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  chipTextActive: { color: '#fff' },

  count: { paddingHorizontal: 20, marginTop: 16, marginBottom: 10, fontSize: 13, color: Brand.muted, fontWeight: '600' },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginBottom: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Brand.line },
  jobCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Brand.line },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  trade: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  meta: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  metaDim: { fontSize: 12, color: Brand.muted },
  jobBudget: { fontSize: 13, fontWeight: '700', color: Brand.red, marginTop: 6 },
  cta: { backgroundColor: Brand.redSoft, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  ctaText: { color: Brand.red, fontWeight: '700', fontSize: 13 },
});
