import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

const CATEGORIES = ['All', 'Electrician', 'Plumbing', 'AC Repair', 'Carpentry', 'Painting', 'Masonry'];

export default function JobsScreen() {
  const { openJobs, myBidForJob } = useStore();
  const [active, setActive] = useState('All');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const jobs = openJobs().filter(
    (j) =>
      (active === 'All' || j.trade === active) &&
      (!q || j.title.toLowerCase().includes(q) || j.trade.toLowerCase().includes(q) || j.area.toLowerCase().includes(q)),
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>Jobs to Bid On</Text>
        <Text style={styles.sub}>Browse open jobs posted near you and send a quote.</Text>
        <View style={styles.searchField}>
          <Ionicons name="search" size={18} color={Brand.muted} />
          <TextInput placeholder="Search jobs…" placeholderTextColor={Brand.muted} style={styles.searchInput} value={query} onChangeText={setQuery} />
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

        <Text style={styles.count}>{jobs.length} open job{jobs.length === 1 ? '' : 's'}</Text>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {jobs.map((j) => {
            const myBid = myBidForJob(j.id);
            return (
              <Pressable key={j.id} style={styles.card} onPress={() => router.push({ pathname: '/job/[id]', params: { id: j.id } })}>
                <View style={[styles.icon, { backgroundColor: j.bg }]}>
                  <Ionicons name={j.icon} size={24} color={j.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.title}>{j.title}</Text>
                  <Text style={styles.meta}>{j.trade} · {j.area} · {j.createdAt}</Text>
                  <Text style={styles.budget}>
                    {j.budgetMin && j.budgetMax ? `TTD $${j.budgetMin} – $${j.budgetMax}` : 'Open to quotes'}
                  </Text>
                </View>
                {myBid ? (
                  <View style={styles.quotedTag}><Text style={styles.quotedText}>Quoted</Text></View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={Brand.muted} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  headerWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  h1: { fontSize: 26, fontWeight: '800', color: Brand.ink },
  sub: { fontSize: 13, color: Brand.muted, marginTop: 4, marginBottom: 14 },
  searchField: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.surfaceAlt, borderRadius: 12, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Brand.ink },

  chips: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Brand.surfaceAlt },
  chipActive: { backgroundColor: Brand.red },
  chipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  chipTextActive: { color: '#fff' },

  count: { paddingHorizontal: 20, marginTop: 16, marginBottom: 10, fontSize: 13, color: Brand.muted, fontWeight: '600' },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Brand.line },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  budget: { fontSize: 13, fontWeight: '700', color: Brand.red, marginTop: 6 },
  quotedTag: { backgroundColor: '#E9F8EE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  quotedText: { color: Brand.green, fontSize: 11, fontWeight: '700' },
});
