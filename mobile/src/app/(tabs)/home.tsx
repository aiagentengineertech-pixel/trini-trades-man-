import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ambient } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useStore, type IconName } from '@/lib/store';

const SERVICES: { name: string; icon: IconName; color: string; bg: string }[] = [
  { name: 'Electrician', icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
  { name: 'Plumbing', icon: 'water', color: '#2F6FED', bg: '#EAF1FE' },
  { name: 'AC Repair', icon: 'snow', color: '#16B1C9', bg: '#E6F8FB' },
  { name: 'Carpentry', icon: 'hammer', color: '#E8852B', bg: '#FDF1E6' },
  { name: 'Painting', icon: 'color-fill', color: '#2EA84F', bg: '#E9F8EE' },
  { name: 'Masonry', icon: 'cube', color: '#8B5CF6', bg: '#F1ECFE' },
];

const TRUST = [
  { icon: 'shield-checkmark' as IconName, title: 'Verified Pros', sub: 'ID checked & rated' },
  { icon: 'lock-closed' as IconName, title: 'Secure Payments', sub: 'Escrow protection' },
  { icon: 'document-text' as IconName, title: 'Branded Invoices', sub: 'Generated in seconds' },
];

export default function HomeScreen() {
  const { pros, openJobs } = useStore();
  const jobs = openJobs();
  return (
    <View style={styles.root}>
      <Ambient />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <StatusBar style="dark" />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="hammer" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.brandName}>
                TRINI <Text style={styles.brandNameAlt}>TRADESMAN</Text>
              </Text>
              <Text style={styles.brandTag}>FIX IT. TRUST IT.</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
              <Ionicons name="notifications-outline" size={24} color={Brand.ink} />
              <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
            </Pressable>
            <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
              <Ionicons name="person" size={20} color={Brand.muted} />
            </Pressable>
          </View>
        </View>

        {/* Location */}
        <Pressable style={styles.locationRow}>
          <Ionicons name="location" size={16} color={Brand.red} />
          <Text style={styles.locationText}>Port of Spain, Trinidad & Tobago</Text>
          <Ionicons name="chevron-down" size={16} color={Brand.muted} />
        </Pressable>

        {/* Hero */}
        <Text style={styles.hero}>Get it <Text style={{ color: Brand.red }}>Done.</Text></Text>
        <Text style={styles.heroSub}>Quality work. Fair prices. Peace of mind.</Text>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={20} color={Brand.muted} />
            <TextInput placeholder="What service do you need?" placeholderTextColor={Brand.muted} style={styles.searchInput} />
          </View>
          <Pressable style={styles.searchBtn} onPress={() => router.push('/explore')}>
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {TRUST.map((t, i) => (
            <View key={t.title} style={[styles.trustItem, i < TRUST.length - 1 && styles.trustDivider]}>
              <Ionicons name={t.icon} size={20} color={Brand.red} />
              <View style={styles.trustText}>
                <Text style={styles.trustTitle}>{t.title}</Text>
                <Text style={styles.trustSub}>{t.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Popular Services */}
        <SectionHeader title="Popular Services" onPress={() => router.push('/explore')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
          {SERVICES.map((s) => (
            <Pressable key={s.name} style={styles.serviceCard} onPress={() => router.push('/explore')}>
              <View style={[styles.serviceIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={26} color={s.color} />
              </View>
              <Text style={styles.serviceLabel}>{s.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Top Rated Near You */}
        <SectionHeader title="Top Rated Near You" onPress={() => router.push('/explore')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prosRow}>
          {pros.slice(0, 4).map((p) => (
            <Pressable key={p.id} style={styles.proCard} onPress={() => router.push({ pathname: '/pro/[id]', params: { id: p.id } })}>
              <View style={[styles.proImage, { backgroundColor: p.bg }]}>
                <Ionicons name={p.icon} size={40} color={p.color} />
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingText}>{p.rating.toFixed(1)}</Text>
                  <Ionicons name="star" size={11} color={Brand.star} />
                </View>
              </View>
              <Text style={styles.proName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.proTrade}>{p.trade}</Text>
              <View style={styles.proMetaRow}>
                <Ionicons name="location" size={12} color={Brand.red} />
                <Text style={styles.proDistance}>{p.distance}</Text>
                {p.verified && <View style={styles.verifiedPill}><Text style={styles.verifiedText}>Verified</Text></View>}
              </View>
              <View style={styles.hireBtn}><Text style={styles.hireBtnText}>Hire Now</Text></View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Jobs Near You */}
        <SectionHeader title="Jobs Near You" onPress={() => router.push('/jobs')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prosRow}>
          {jobs.map((j) => (
            <Pressable key={j.id} style={styles.proCard} onPress={() => router.push({ pathname: '/job/[id]', params: { id: j.id } })}>
              <View style={[styles.proImage, { backgroundColor: j.bg }]}>
                <Ionicons name={j.icon} size={40} color={j.color} />
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingText}>{j.createdAt}</Text>
                </View>
              </View>
              <Text style={styles.proName} numberOfLines={1}>{j.title}</Text>
              <Text style={styles.proTrade}>{j.trade}</Text>
              <View style={styles.proMetaRow}>
                <Ionicons name="location" size={12} color={Brand.red} />
                <Text style={styles.proDistance}>{j.area}</Text>
              </View>
              <Text style={styles.jobBudgetLine}>
                {j.budgetMin && j.budgetMax ? `TTD $${j.budgetMin}–$${j.budgetMax}` : 'Open to quotes'}
              </Text>
              <View style={styles.hireBtn}><Text style={styles.hireBtnText}>View Job</Text></View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Post a Job banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}><Ionicons name="clipboard" size={24} color="#fff" /></View>
          <View style={styles.flex}>
            <Text style={styles.bannerTitle}>Need something specific?</Text>
            <Text style={styles.bannerSub}>Post your job and get quotes from verified tradesmen.</Text>
          </View>
          <Pressable style={styles.bannerBtn} onPress={() => router.push('/post')}>
            <Text style={styles.bannerBtnText}>Post a Job</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable style={styles.viewAll} onPress={onPress}>
        <Text style={styles.viewAllText}>View all</Text>
        <Ionicons name="chevron-forward" size={14} color={Brand.red} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.surface },
  flex: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 38, height: 38, borderRadius: 10, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 16, fontWeight: '800', color: Brand.red, letterSpacing: 0.5 },
  brandNameAlt: { color: Brand.ink },
  brandTag: { fontSize: 9, fontWeight: '700', color: Brand.muted, letterSpacing: 1.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: Brand.red, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, marginTop: 18 },
  locationText: { fontSize: 13, fontWeight: '600', color: Brand.body },

  hero: { fontSize: 30, fontWeight: '800', color: Brand.ink, paddingHorizontal: 20, lineHeight: 36 },
  heroSub: { fontSize: 14, color: Brand.muted, paddingHorizontal: 20, marginTop: 8 },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 18, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', shadowColor: '#0B1220', shadowOpacity: 0.10, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Brand.ink, paddingVertical: 8 },
  searchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Brand.red, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  trustRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: Brand.line },
  trustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
  trustDivider: { borderRightWidth: 1, borderRightColor: Brand.line },
  trustText: { flex: 1 },
  trustTitle: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  trustSub: { fontSize: 10, color: Brand.muted },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: Brand.ink },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 13, fontWeight: '700', color: Brand.red },

  servicesRow: { paddingHorizontal: 20, gap: 12 },
  serviceCard: { width: 84, alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.72)', shadowColor: '#0B1220', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  serviceIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { fontSize: 12, fontWeight: '600', color: Brand.body },

  prosRow: { paddingHorizontal: 20, gap: 14 },
  proCard: { width: 190, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.78)', overflow: 'hidden', paddingBottom: 12, shadowColor: '#0B1220', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  proImage: { height: 110, alignItems: 'center', justifyContent: 'center' },
  ratingPill: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(14,17,22,0.85)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  proName: { fontSize: 15, fontWeight: '700', color: Brand.ink, paddingHorizontal: 12, marginTop: 10 },
  proTrade: { fontSize: 12, color: Brand.muted, paddingHorizontal: 12, marginTop: 2 },
  proMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, marginTop: 8 },
  proDistance: { fontSize: 11, color: Brand.body },
  jobBudgetLine: { fontSize: 12, fontWeight: '800', color: Brand.red, paddingHorizontal: 12, marginTop: 6 },
  verifiedPill: { marginLeft: 'auto', borderWidth: 1, borderColor: Brand.red, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  verifiedText: { fontSize: 9, fontWeight: '700', color: Brand.red },
  hireBtn: { backgroundColor: Brand.red, marginHorizontal: 12, marginTop: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  hireBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 28, padding: 16, borderRadius: 18, backgroundColor: Brand.redSoft },
  bannerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  bannerSub: { fontSize: 12, color: Brand.body, marginTop: 2 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Brand.red, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  bannerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
