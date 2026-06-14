import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { Ambient, Badge, Card, ListRow, Progress, Segmented, SectionTitle, StatCard, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';

type JobStatusTab = 'Active' | 'Pending' | 'Completed' | 'Cancelled';

interface MockJob { title: string; category: string; budget: string; status: string; pro: string; date: string; icon: IconName; color: string; bg: string; }

const JOBS: Record<JobStatusTab, MockJob[]> = {
  Active: [
    { title: 'Kitchen Renovation', category: 'Carpentry', budget: 'TT$8,500', status: 'In Progress', pro: "John's Construction", date: 'Started Jun 8', icon: 'hammer', color: '#E8852B', bg: '#FDF1E6' },
    { title: 'Rewire living room', category: 'Electrician', budget: 'TT$2,200', status: 'Accepted', pro: "John's Electrical", date: 'Jun 12', icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
  ],
  Pending: [
    { title: 'Fix bathroom leak', category: 'Plumbing', budget: 'TT$600 – $900', status: '3 quotes', pro: 'Awaiting your choice', date: 'Jun 13', icon: 'water', color: '#2F6FED', bg: '#EAF1FE' },
  ],
  Completed: [
    { title: 'AC servicing', category: 'AC Repair', budget: 'TT$450', status: 'Completed', pro: 'Cool Breeze AC', date: 'May 28', icon: 'snow', color: '#16B1C9', bg: '#E6F8FB' },
    { title: 'Exterior painting', category: 'Painting', budget: 'TT$5,200', status: 'Completed', pro: 'Fresh Coat Painting', date: 'May 10', icon: 'color-fill', color: '#2EA84F', bg: '#E9F8EE' },
  ],
  Cancelled: [
    { title: 'Garden wall (cancelled)', category: 'Masonry', budget: 'TT$3,000', status: 'Cancelled', pro: '—', date: 'Apr 30', icon: 'cube', color: '#8B5CF6', bg: '#F1ECFE' },
  ],
};

const ADDRESSES: { nick: string; address: string; icon: IconName }[] = [
  { nick: 'Home', address: '12 Saddle Road, Diego Martin', icon: 'home' },
  { nick: 'Rental Property', address: '5B Ariapita Ave, Woodbrook', icon: 'business' },
];

const TXNS = [
  { tradesman: 'Sandy Electrical', amount: 'TT$1,200', status: 'Completed', date: 'Jun 10, 2026', method: 'Visa •••• 4242' },
  { tradesman: 'Cool Breeze AC', amount: 'TT$450', status: 'Completed', date: 'May 28, 2026', method: 'WiPay' },
  { tradesman: 'Fresh Coat Painting', amount: 'TT$5,200', status: 'Released', date: 'May 12, 2026', method: 'Visa •••• 4242' },
];

export default function ProfileScreen() {
  const { email } = useAuth();
  const { pros, myProfile } = useStore();
  const [tab, setTab] = useState<JobStatusTab>('Active');
  const [saved, setSaved] = useState(pros.slice(0, 4));
  const displayName =
    myProfile?.fullName?.trim() ||
    (email ? email.split('@')[0].replace(/[._+]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'My Account');
  const area = myProfile?.area?.trim() || 'Trinidad & Tobago';

  return (
    <View style={styles.root}>
      <Ambient />
      <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* ===== Header ===== */}
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="create-outline" size={20} color={Brand.ink} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={Brand.ink} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <View style={styles.avatar}>
            {myProfile?.photoUrl ? (
              <Image source={{ uri: myProfile.photoUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Ionicons name="person" size={44} color={Brand.muted} />
            )}
            <View style={styles.avatarCheck}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Brand.muted} />
            <Text style={styles.location}>{area}</Text>
          </View>
          <Text style={styles.member}>Member since June 2026</Text>

          <View style={styles.badgeRow}>
            <Badge label="Phone" icon="checkmark-circle" />
            <Badge label="Email" icon="checkmark-circle" />
            <Badge label="Payment" icon="checkmark-circle" />
          </View>
        </View>

        {/* ===== Profile completion ===== */}
        <View style={styles.section}>
          <Card>
            <View style={styles.completeTop}>
              <Text style={styles.completeTitle}>Profile Completion</Text>
              <Text style={styles.completePct}>85%</Text>
            </View>
            <Progress percent={85} />
            <View style={styles.missingRow}>
              <Text style={styles.missingLabel}>Missing:</Text>
              <View style={styles.missingChip}><Text style={styles.missingChipText}>Profile photo</Text></View>
              <View style={styles.missingChip}><Text style={styles.missingChipText}>Government ID</Text></View>
            </View>
          </Card>
        </View>

        {/* ===== Quick stats ===== */}
        <View style={[styles.section, styles.statsRow]}>
          <StatCard value="12" label="Jobs Posted" icon="briefcase" />
          <StatCard value="10" label="Completed" icon="checkmark-done" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value="8" label="Reviews" icon="star" tint="#F5A623" bg="#FEF4E2" />
          <StatCard value="25" label="Saved" icon="heart" tint="#E11D26" bg="#FDECEC" />
        </View>

        {/* ===== My Jobs ===== */}
        <View style={styles.section}>
          <SectionTitle title="My Jobs" />
          <Segmented options={['Active', 'Pending', 'Completed', 'Cancelled']} value={tab} onChange={(v) => setTab(v as JobStatusTab)} />
          <View style={{ marginTop: 12, gap: 10 }}>
            {JOBS[tab].map((j, i) => (
              <Card key={i} style={styles.jobCard}>
                <View style={[styles.jobIcon, { backgroundColor: j.bg }]}>
                  <Ionicons name={j.icon} size={22} color={j.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.jobTitle}>{j.title}</Text>
                  <Text style={styles.jobMeta}>{j.category} · {j.pro}</Text>
                  <Text style={styles.jobDate}>{j.date}</Text>
                </View>
                <View style={styles.jobRight}>
                  <Text style={styles.jobBudget}>{j.budget}</Text>
                  <View style={styles.jobStatus}><Text style={styles.jobStatusText}>{j.status}</Text></View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* ===== Saved Tradesmen ===== */}
        <View style={styles.section}>
          <SectionTitle title="Saved Tradesmen" action="See all" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {saved.map((p) => (
              <Card key={p.id} style={styles.savedCard}>
                <View style={styles.savedTop}>
                  <View style={[styles.savedAvatar, { backgroundColor: p.bg }]}>
                    <Ionicons name={p.icon} size={24} color={p.color} />
                  </View>
                  <Pressable hitSlop={8} onPress={() => setSaved((s) => s.filter((x) => x.id !== p.id))}>
                    <Ionicons name="heart" size={20} color={Brand.red} />
                  </Pressable>
                </View>
                <Text style={styles.savedName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.savedTrade}>{p.trade}</Text>
                <View style={styles.savedMeta}>
                  <Ionicons name="star" size={12} color={Brand.star} />
                  <Text style={styles.savedRating}>{p.rating.toFixed(1)}</Text>
                  <Text style={styles.savedDist}>· {p.distance}</Text>
                </View>
                <View style={styles.savedBtns}>
                  <Pressable style={styles.savedMsg} onPress={() => router.push({ pathname: '/pro/[id]', params: { id: p.id } })}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={Brand.red} />
                  </Pressable>
                  <Pressable style={styles.savedHire} onPress={() => router.push({ pathname: '/pro/[id]', params: { id: p.id } })}>
                    <Text style={styles.savedHireText}>Hire</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* ===== Payment methods ===== */}
        <View style={styles.section}>
          <SectionTitle title="Payment Methods" action="Manage" onAction={() => router.push('/payment-methods')} />
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="card" label="Visa •••• 4242" value="Default" />
            <ListRow icon="phone-portrait-outline" label="WiPay wallet" value="Linked" last />
          </Card>
        </View>

        {/* ===== Addresses ===== */}
        <View style={styles.section}>
          <SectionTitle title="Addresses" action="Add" />
          <Card style={{ paddingVertical: 4 }}>
            {ADDRESSES.map((a, i) => (
              <ListRow key={a.nick} icon={a.icon} label={a.nick} value={a.address.split(',')[0]} onPress={() => {}} last={i === ADDRESSES.length - 1} />
            ))}
          </Card>
        </View>

        {/* ===== Transaction history ===== */}
        <View style={styles.section}>
          <SectionTitle title="Transaction History" action="See all" />
          <Card style={{ paddingVertical: 4 }}>
            {TXNS.map((t, i) => (
              <View key={i} style={[styles.txn, i < TXNS.length - 1 && styles.txnDivider]}>
                <View style={styles.txnIcon}>
                  <Ionicons name="receipt-outline" size={18} color={Brand.body} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.txnPro}>{t.tradesman}</Text>
                  <Text style={styles.txnMeta}>{t.date} · {t.method}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.txnAmount}>{t.amount}</Text>
                  <Text style={styles.txnStatus}>{t.status}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* ===== Reviews given ===== */}
        <View style={styles.section}>
          <SectionTitle title="Reviews Given" action="See all" onAction={() => router.push('/my-reviews')} />
          <Card>
            <View style={styles.reviewsSummary}>
              <Ionicons name="star" size={20} color={Brand.star} />
              <Text style={styles.reviewsText}>You've left <Text style={{ fontWeight: '800' }}>8 reviews</Text> for tradesmen you hired.</Text>
              <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
            </View>
          </Card>
        </View>

        {/* ===== Settings shortcut ===== */}
        <View style={styles.section}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="shield-checkmark-outline" label="Security & verification" onPress={() => router.push('/settings')} />
            <ListRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/settings')} />
            <ListRow icon="help-circle-outline" label="Help & support" onPress={() => router.push('/help')} last />
          </Card>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.surface },
  flex: { flex: 1, backgroundColor: 'transparent' },
  section: { paddingHorizontal: 20, marginTop: 22 },

  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

  header: { alignItems: 'center', paddingTop: 4 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  avatarImg: { width: 100, height: 100 },
  avatarCheck: { position: 'absolute', bottom: 4, right: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: Brand.green, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: '800', color: Brand.ink, letterSpacing: -0.4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  location: { fontSize: 14, color: Brand.muted },
  member: { fontSize: 12, color: Brand.muted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },

  completeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  completeTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  completePct: { fontSize: 18, fontWeight: '800', color: Brand.red },
  missingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  missingLabel: { fontSize: 12, color: Brand.muted, fontWeight: '600' },
  missingChip: { backgroundColor: Brand.surfaceAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  missingChipText: { fontSize: 12, color: Brand.body, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10 },

  jobCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  jobIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  jobTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  jobMeta: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  jobDate: { fontSize: 11, color: Brand.muted, marginTop: 3 },
  jobRight: { alignItems: 'flex-end', gap: 6 },
  jobBudget: { fontSize: 14, fontWeight: '800', color: Brand.ink },
  jobStatus: { backgroundColor: Brand.redSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  jobStatusText: { fontSize: 11, fontWeight: '700', color: Brand.red },

  savedCard: { width: 170, padding: 14 },
  savedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  savedAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  savedName: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  savedTrade: { fontSize: 12, color: Brand.muted, marginTop: 1 },
  savedMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  savedRating: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  savedDist: { fontSize: 11, color: Brand.muted },
  savedBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  savedMsg: { width: 40, height: 36, borderRadius: 10, borderWidth: 1, borderColor: Brand.line, alignItems: 'center', justifyContent: 'center' },
  savedHire: { flex: 1, height: 36, borderRadius: 10, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  savedHireText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  txnDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  txnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  txnPro: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  txnMeta: { fontSize: 11, color: Brand.muted, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  txnStatus: { fontSize: 11, color: Brand.green, fontWeight: '600', marginTop: 2 },

  reviewsSummary: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewsText: { flex: 1, fontSize: 14, color: Brand.body },
});
