import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import type { Job, JobStatus } from '@/lib/store-types';

export default function JobsScreen() {
  const { role } = useAuth();
  return role === 'tradesman' ? <TradesmanJobs /> : <CustomerJobs />;
}

/* ───────────────────────── Customer: My Jobs dashboard ───────────────────────── */

const STATUS_META: Record<JobStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Collecting quotes', color: '#2F6FED', bg: '#EAF1FE' },
  hired: { label: 'In progress', color: '#E8852B', bg: '#FDF1E6' },
  done: { label: 'Completed', color: '#2EA84F', bg: '#E9F8EE' },
};

const FILTERS: { key: 'all' | JobStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'hired', label: 'In progress' },
  { key: 'done', label: 'Completed' },
];

function CustomerJobs() {
  const { myJobs, bidsForJob } = useStore();
  const [filter, setFilter] = useState<'all' | JobStatus>('all');

  const jobs = myJobs();
  const activeCount = jobs.filter((j) => j.status === 'open' || j.status === 'hired').length;
  const totalQuotes = jobs
    .filter((j) => j.status === 'open')
    .reduce((sum, j) => sum + bidsForJob(j.id).filter((b) => b.status === 'pending').length, 0);
  const inEscrow = jobs
    .filter((j) => j.status === 'hired')
    .reduce((sum, j) => {
      const accepted = bidsForJob(j.id).find((b) => b.status === 'accepted');
      return sum + (accepted?.amount ?? 0);
    }, 0);

  const shown = jobs.filter((j) => filter === 'all' || j.status === filter);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>My Jobs</Text>
        <Text style={styles.sub}>Track your posted jobs, quotes and payments.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Snapshot */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalQuotes}</Text>
            <Text style={styles.statLabel}>New quotes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { fontSize: 16 }]}>TT${inEscrow.toLocaleString()}</Text>
            <Text style={styles.statLabel}>In escrow</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, styles.actionPrimary]} onPress={() => router.push('/post')}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.actionPrimaryText}>Post a job</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionGhost]} onPress={() => router.push('/payment-methods')}>
            <Ionicons name="card-outline" size={18} color={Brand.ink} />
            <Text style={styles.actionGhostText}>Payments</Text>
          </Pressable>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, filter === f.key && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {shown.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="briefcase-outline" size={32} color={Brand.muted} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No jobs yet' : 'Nothing here'}
            </Text>
            <Text style={styles.emptySub}>
              {filter === 'all'
                ? 'Post your first job and verified pros will send you quotes.'
                : 'No jobs match this filter right now.'}
            </Text>
            {filter === 'all' && (
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/post')}>
                <Text style={styles.emptyBtnText}>Post a Job</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 4 }}>
            {shown.map((j) => (
              <CustomerJobCard key={j.id} job={j} quotes={bidsForJob(j.id)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CustomerJobCard({ job, quotes }: { job: Job; quotes: ReturnType<typeof useStore>['bids'] }) {
  const meta = STATUS_META[job.status];
  const pending = quotes.filter((b) => b.status === 'pending').length;
  const accepted = quotes.find((b) => b.status === 'accepted');

  return (
    <Pressable style={styles.card} onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}>
      <View style={styles.cardTop}>
        <View style={[styles.icon, { backgroundColor: job.bg }]}>
          <Ionicons name={job.icon} size={22} color={job.color} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.meta}>{job.trade} · {job.area} · {job.createdAt}</Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {job.status === 'open' ? (
          <Text style={styles.footerStrong}>
            {pending > 0 ? `${pending} quote${pending === 1 ? '' : 's'} received` : 'Waiting for quotes…'}
          </Text>
        ) : accepted ? (
          <Text style={styles.footerStrong}>Hired · TT${accepted.amount.toLocaleString()}{accepted.proName ? ` · ${accepted.proName}` : ''}</Text>
        ) : (
          <Text style={styles.footerMuted}>{meta.label}</Text>
        )}
        <View style={styles.viewLink}>
          <Text style={styles.viewLinkText}>View</Text>
          <Ionicons name="chevron-forward" size={15} color={Brand.red} />
        </View>
      </View>
    </Pressable>
  );
}

/* ───────────────────────── Tradesman: Jobs to bid on ───────────────────────── */

import { TRADES } from '@/constants/trades';

const CATEGORIES = ['All', ...TRADES];

function TradesmanJobs() {
  const { openJobs, myBidForJob, distanceKm, distanceLabel } = useStore();
  const { userId } = useAuth();
  const [active, setActive] = useState('All');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const jobs = openJobs()
    .filter(
      (j) =>
        (active === 'All' || j.trade === active) &&
        (!q || j.title.toLowerCase().includes(q) || j.trade.toLowerCase().includes(q) || j.area.toLowerCase().includes(q)),
    )
    // Invited jobs first, then nearest to you.
    .sort((a, b) => {
      const inv = Number(b.invitedProId === userId) - Number(a.invitedProId === userId);
      if (inv !== 0) return inv;
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
              <Pressable key={j.id} style={styles.proCard} onPress={() => router.push({ pathname: '/job/[id]', params: { id: j.id } })}>
                <View style={[styles.icon, { backgroundColor: j.bg }]}>
                  <Ionicons name={j.icon} size={24} color={j.color} />
                </View>
                <View style={styles.flex}>
                  {j.invitedProId === userId && (
                    <View style={styles.invitedTag}>
                      <Ionicons name="star" size={10} color={Brand.red} />
                      <Text style={styles.invitedText}>Invited to quote</Text>
                    </View>
                  )}
                  <Text style={styles.title}>{j.title}</Text>
                  <Text style={styles.meta}>{j.trade} · {j.area} · {j.createdAt}</Text>
                  <Text style={styles.budget}>
                    {j.budgetMin && j.budgetMax ? `TTD $${j.budgetMin} – $${j.budgetMax}` : 'Open to quotes'}
                    {distanceLabel(j.lat, j.lng) ? `   ·   ${distanceLabel(j.lat, j.lng)}` : ''}
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

  // Customer snapshot
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Brand.surface, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#0E1116', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: Brand.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: 11.5, color: Brand.muted, marginTop: 4, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 6 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 13 },
  actionPrimary: { backgroundColor: Brand.red },
  actionPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  actionGhost: { backgroundColor: Brand.surfaceAlt },
  actionGhostText: { color: Brand.ink, fontWeight: '700', fontSize: 14 },

  chips: { paddingHorizontal: 20, gap: 8, paddingVertical: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Brand.surfaceAlt },
  chipActive: { backgroundColor: Brand.red },
  chipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  chipTextActive: { color: '#fff' },

  count: { paddingHorizontal: 20, marginTop: 16, marginBottom: 10, fontSize: 13, color: Brand.muted, fontWeight: '600' },

  // Customer job card
  card: { borderRadius: 16, borderWidth: 1, borderColor: Brand.line, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  footerStrong: { fontSize: 13, fontWeight: '700', color: Brand.ink },
  footerMuted: { fontSize: 13, color: Brand.muted },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewLinkText: { color: Brand.red, fontWeight: '700', fontSize: 13 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Tradesman bid card
  proCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Brand.line },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  budget: { fontSize: 13, fontWeight: '700', color: Brand.red, marginTop: 6 },
  quotedTag: { backgroundColor: '#E9F8EE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  quotedText: { color: Brand.green, fontSize: 11, fontWeight: '700' },
  invitedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: Brand.redSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, marginBottom: 4 },
  invitedText: { color: Brand.red, fontSize: 10, fontWeight: '800' },

  // Empty state
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink },
  emptySub: { fontSize: 14, color: Brand.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyBtn: { backgroundColor: Brand.red, borderRadius: 13, paddingHorizontal: 28, paddingVertical: 14, marginTop: 20 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
