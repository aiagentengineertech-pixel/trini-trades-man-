import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { Ambient, Badge, Card, ListRow, Progress, Segmented, SectionTitle, StatCard } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchPortfolio, fetchReviewsGiven } from '@/lib/db';
import { useStore } from '@/lib/store';

type JobStatusTab = 'Active' | 'Pending' | 'Completed';

export default function ProfileScreen() {
  const { role } = useAuth();
  return role === 'tradesman' ? <TradesmanProfile /> : <CustomerProfile />;
}

function CustomerProfile() {
  const { email, userId } = useAuth();
  const { pros, myProfile, myJobs, bidsForJob, distanceLabel } = useStore();
  const [tab, setTab] = useState<JobStatusTab>('Active');
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => { if (userId) fetchReviewsGiven(userId).then((r) => setReviewCount(r.length)); }, [userId]);

  const displayName =
    myProfile?.fullName?.trim() ||
    (email ? email.split('@')[0].replace(/[._+]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'My Account');
  const area = myProfile?.area?.trim() || 'Trinidad & Tobago';

  const jobs = myJobs();
  const completed = jobs.filter((j) => j.status === 'done').length;
  const active = jobs.filter((j) => j.status === 'hired').length;

  // Profile completion from real fields.
  const checks = [!!myProfile?.fullName, !!myProfile?.phone, !!myProfile?.area, !!myProfile?.photoUrl];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const missing = [
    !myProfile?.fullName && 'Name', !myProfile?.phone && 'Phone', !myProfile?.area && 'Area', !myProfile?.photoUrl && 'Photo',
  ].filter(Boolean) as string[];

  const tabFor: Record<JobStatusTab, (s: string) => boolean> = {
    Active: (s) => s === 'hired',
    Pending: (s) => s === 'open',
    Completed: (s) => s === 'done',
  };
  const shownJobs = jobs.filter((j) => tabFor[tab](j.status));

  // Transactions = the customer's hired/done jobs (accepted bid amount held/released).
  const txns = jobs
    .filter((j) => j.status === 'hired' || j.status === 'done')
    .map((j) => {
      const accepted = bidsForJob(j.id).find((b) => b.status === 'accepted');
      return { id: j.id, pro: accepted?.proName ?? 'Tradesman', amount: accepted?.amount ?? 0, status: j.status === 'done' ? 'Released' : 'In escrow', date: j.createdAt };
    });

  const recommended = pros.slice(0, 4);

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
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Brand.muted} />
            <Text style={styles.location}>{area}</Text>
          </View>

          <View style={styles.badgeRow}>
            {!!myProfile?.phone && <Badge label="Phone" icon="checkmark-circle" />}
            {!!email && <Badge label="Email" icon="checkmark-circle" />}
            {myProfile?.verified && <Badge label="Verified" icon="shield-checkmark" />}
          </View>
        </View>

        {/* ===== Profile completion (real) ===== */}
        {pct < 100 && (
          <View style={styles.section}>
            <Pressable onPress={() => router.push('/edit-profile')}>
              <Card>
                <View style={styles.completeTop}>
                  <Text style={styles.completeTitle}>Profile Completion</Text>
                  <Text style={styles.completePct}>{pct}%</Text>
                </View>
                <Progress percent={pct} />
                {missing.length > 0 && (
                  <View style={styles.missingRow}>
                    <Text style={styles.missingLabel}>Add:</Text>
                    {missing.map((m) => (
                      <View key={m} style={styles.missingChip}><Text style={styles.missingChipText}>{m}</Text></View>
                    ))}
                  </View>
                )}
              </Card>
            </Pressable>
          </View>
        )}

        {/* ===== Quick stats (real) ===== */}
        <View style={[styles.section, styles.statsRow]}>
          <StatCard value={`${jobs.length}`} label="Jobs Posted" icon="briefcase" />
          <StatCard value={`${active}`} label="In Progress" icon="time" tint="#E8852B" bg="#FDF1E6" />
          <StatCard value={`${completed}`} label="Completed" icon="checkmark-done" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value={`${reviewCount}`} label="Reviews" icon="star" tint="#F5A623" bg="#FEF4E2" />
        </View>

        {/* ===== My Jobs (real) ===== */}
        <View style={styles.section}>
          <SectionTitle title="My Jobs" action="See all" onAction={() => router.push('/jobs')} />
          <Segmented options={['Active', 'Pending', 'Completed']} value={tab} onChange={(v) => setTab(v as JobStatusTab)} />
          <View style={{ marginTop: 12, gap: 10 }}>
            {shownJobs.length === 0 && <Text style={styles.noneText}>No {tab.toLowerCase()} jobs.</Text>}
            {shownJobs.map((j) => {
              const quotes = bidsForJob(j.id);
              const accepted = quotes.find((b) => b.status === 'accepted');
              return (
                <Pressable key={j.id} onPress={() => router.push({ pathname: '/job/[id]', params: { id: j.id } })}>
                  <Card style={styles.jobCard}>
                    <View style={[styles.jobIcon, { backgroundColor: j.bg }]}>
                      <Ionicons name={j.icon} size={22} color={j.color} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.jobTitle}>{j.title}</Text>
                      <Text style={styles.jobMeta}>{j.trade} · {j.area}</Text>
                      <Text style={styles.jobDate}>{j.createdAt}</Text>
                    </View>
                    <View style={styles.jobRight}>
                      {accepted ? (
                        <Text style={styles.jobBudget}>TT${accepted.amount.toLocaleString()}</Text>
                      ) : j.budgetMin && j.budgetMax ? (
                        <Text style={styles.jobBudget}>TT${j.budgetMin}–{j.budgetMax}</Text>
                      ) : null}
                      <View style={styles.jobStatus}><Text style={styles.jobStatusText}>{j.status === 'open' ? `${quotes.length} quote${quotes.length === 1 ? '' : 's'}` : j.status === 'hired' ? 'In progress' : 'Done'}</Text></View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ===== Recommended tradesmen (real) ===== */}
        <View style={styles.section}>
          <SectionTitle title="Recommended Pros" action="See all" onAction={() => router.push('/explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {recommended.map((p) => (
              <Card key={p.id} style={styles.savedCard}>
                <View style={styles.savedTop}>
                  <View style={[styles.savedAvatar, { backgroundColor: p.bg }]}>
                    <Ionicons name={p.icon} size={24} color={p.color} />
                  </View>
                </View>
                <Text style={styles.savedName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.savedTrade}>{p.trade}</Text>
                <View style={styles.savedMeta}>
                  <Ionicons name="star" size={12} color={Brand.star} />
                  <Text style={styles.savedRating}>{p.reviewsCount > 0 ? p.rating.toFixed(1) : 'New'}</Text>
                  {distanceLabel(p.lat, p.lng) && <Text style={styles.savedDist}>· {distanceLabel(p.lat, p.lng)}</Text>}
                </View>
                <View style={styles.savedBtns}>
                  <Pressable style={styles.savedHire} onPress={() => router.push({ pathname: '/pro/[id]', params: { id: p.id } })}>
                    <Text style={styles.savedHireText}>View</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* ===== Payments ===== */}
        <View style={styles.section}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="card-outline" label="Payment methods" onPress={() => router.push('/payment-methods')} last />
          </Card>
        </View>

        {/* ===== Transaction history (real) ===== */}
        {txns.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title="Payments" />
            <Card style={{ paddingVertical: 4 }}>
              {txns.map((t, i) => (
                <View key={t.id} style={[styles.txn, i < txns.length - 1 && styles.txnDivider]}>
                  <View style={styles.txnIcon}>
                    <Ionicons name="receipt-outline" size={18} color={Brand.body} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.txnPro}>{t.pro}</Text>
                    <Text style={styles.txnMeta}>{t.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txnAmount}>TT${t.amount.toLocaleString()}</Text>
                    <Text style={styles.txnStatus}>{t.status}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* ===== Reviews given (real) ===== */}
        <View style={styles.section}>
          <SectionTitle title="Reviews Given" action="See all" onAction={() => router.push('/my-reviews')} />
          <Pressable onPress={() => router.push('/my-reviews')}>
            <Card>
              <View style={styles.reviewsSummary}>
                <Ionicons name="star" size={20} color={Brand.star} />
                <Text style={styles.reviewsText}>{reviewCount > 0 ? <>You've left <Text style={{ fontWeight: '800' }}>{reviewCount} review{reviewCount === 1 ? '' : 's'}</Text>.</> : 'No reviews yet — rate a tradesman after a completed job.'}</Text>
                <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
              </View>
            </Card>
          </Pressable>
        </View>

        {/* ===== Settings shortcut ===== */}
        <View style={styles.section}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="people-outline" label="My team & assignments" onPress={() => router.push('/team')} />
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

function TradesmanProfile() {
  const { userId, signOut } = useAuth();
  const { myProfile, getPro, myBids, getJob, refresh } = useStore();
  const me = userId ? getPro(userId) : undefined;
  const [portfolioCount, setPortfolioCount] = useState(0);

  useEffect(() => {
    if (userId) fetchPortfolio(userId).then((p) => setPortfolioCount(p.length));
  }, [userId]);

  // Re-pull jobs/bids whenever this screen is focused so an accepted quote
  // (done on the customer's device) shows up here without restarting the app.
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Jobs this tradesman was hired for (their quote was accepted).
  const activeJobs = myBids()
    .filter((b) => b.status === 'accepted')
    .map((b) => ({ bid: b, job: getJob(b.jobId) }))
    .filter((x) => x.job && (x.job.status === 'hired' || x.job.status === 'done'));

  const name = me?.name || myProfile?.fullName?.trim() || 'Your business';
  const trade = me?.trade && me.trade !== 'General' ? me.trade : null;
  const area = myProfile?.area?.trim() || me?.area || 'Trinidad & Tobago';
  const verified = myProfile?.verified || me?.verified;

  return (
    <View style={styles.root}>
      <Ambient />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
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
                <Ionicons name="briefcase" size={40} color={Brand.muted} />
              )}
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.tradeLine}>{trade ? `${trade} · ${area}` : area}</Text>
            <View style={styles.badgeRow}>
              {verified ? (
                <Badge label="Gold Verified" color="#B8860B" icon="shield-checkmark" />
              ) : (
                <Badge label="Not verified" color={Brand.muted} icon="shield-outline" />
              )}
            </View>
          </View>

          {!trade && (
            <View style={styles.section}>
              <Card style={styles.setupCard}>
                <Ionicons name="construct-outline" size={22} color={Brand.red} />
                <Text style={styles.setupText}>Finish your tradesman profile — pick your trade and add a bio so customers can find you.</Text>
                <Pressable style={styles.setupBtn} onPress={() => router.push('/edit-profile')}>
                  <Text style={styles.setupBtnText}>Set up profile</Text>
                </Pressable>
              </Card>
            </View>
          )}

          <View style={[styles.section, styles.statsRow]}>
            <StatCard value={(me?.rating ?? 0).toFixed(1)} label="Rating" icon="star" tint="#F5A623" bg="#FEF4E2" />
            <StatCard value={`${me?.reviewsCount ?? 0}`} label="Reviews" icon="chatbubble-ellipses" tint="#2F6FED" bg="#EAF1FE" />
            <StatCard value={`${me?.jobsDone ?? 0}`} label="Jobs" icon="checkmark-done" tint="#2EA84F" bg="#E9F8EE" />
            <StatCard value={`${portfolioCount}`} label="Portfolio" icon="images" tint="#8B5CF6" bg="#F1ECFE" />
          </View>

          {activeJobs.length > 0 && (
            <View style={styles.section}>
              <SectionTitle title="Active Jobs" action="All" onAction={() => router.push('/jobs-manage')} />
              <Card style={{ paddingVertical: 4 }}>
                {activeJobs.map(({ bid, job }, i) => (
                  <Pressable
                    key={bid.id}
                    style={[styles.activeRow, i < activeJobs.length - 1 && styles.activeRowBorder]}
                    onPress={() => job && router.push({ pathname: '/job/[id]', params: { id: job.id } })}>
                    <View style={styles.activeIcon}>
                      <Ionicons name={job?.status === 'done' ? 'checkmark-done' : 'briefcase'} size={18} color={Brand.green} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.activeTitle} numberOfLines={1}>{job?.title ?? 'Job'}</Text>
                      <Text style={styles.activeSub}>
                        {job?.status === 'done' ? 'Completed' : 'In progress'} · {job?.area}
                      </Text>
                    </View>
                    <Text style={styles.activeAmount}>TT${bid.amount.toLocaleString()}</Text>
                  </Pressable>
                ))}
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <Card style={styles.listingCard}>
              <View style={styles.flex}>
                <Text style={styles.listingTitle}>Your public listing</Text>
                <Text style={styles.listingSub}>See exactly how customers view your profile.</Text>
              </View>
              <Pressable style={styles.viewBtn} onPress={() => userId && router.push({ pathname: '/pro/[id]', params: { id: userId } })}>
                <Text style={styles.viewBtnText}>View</Text>
              </Pressable>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Portfolio" action="Manage" onAction={() => router.push('/portfolio')} />
            <Card style={{ paddingVertical: 4 }}>
              <ListRow
                icon="images-outline"
                label={portfolioCount > 0 ? `${portfolioCount} project${portfolioCount === 1 ? '' : 's'}` : 'Add your first project'}
                onPress={() => router.push('/portfolio')}
                last
              />
            </Card>
          </View>

          <View style={styles.section}>
            <Card style={{ paddingVertical: 4 }}>
              <ListRow icon="grid-outline" label="Business dashboard" onPress={() => router.push('/post')} />
              <ListRow icon="people-circle-outline" label="Clients" onPress={() => router.push('/clients')} />
              <ListRow icon="people-outline" label="Team" onPress={() => router.push('/team')} />
              <ListRow icon="shield-checkmark-outline" label="Verification" onPress={() => router.push('/verification')} />
              <ListRow icon="person-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} />
              <ListRow icon="help-circle-outline" label="Help & support" onPress={() => router.push('/help')} last />
            </Card>
          </View>

          <View style={styles.section}>
            <Pressable style={styles.signOut} onPress={signOut}>
              <Ionicons name="log-out-outline" size={20} color={Brand.red} />
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
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
  tradeLine: { fontSize: 14, color: Brand.muted, marginTop: 6 },

  setupCard: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  setupText: { fontSize: 14, color: Brand.body, textAlign: 'center', lineHeight: 20 },
  setupBtn: { backgroundColor: Brand.red, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, marginTop: 4 },
  setupBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  activeRowBorder: { borderBottomWidth: 1, borderBottomColor: Brand.line },
  activeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E9F8EE', alignItems: 'center', justifyContent: 'center' },
  activeTitle: { fontSize: 14.5, fontWeight: '700', color: Brand.ink },
  activeSub: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  activeAmount: { fontSize: 14, fontWeight: '800', color: Brand.green },
  listingCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listingTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  listingSub: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  viewBtn: { backgroundColor: Brand.redSoft, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  viewBtnText: { color: Brand.red, fontWeight: '700', fontSize: 14 },

  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: Brand.line },
  signOutText: { color: Brand.red, fontWeight: '700', fontSize: 15 },

  completeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  completeTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  completePct: { fontSize: 18, fontWeight: '800', color: Brand.red },
  missingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  missingLabel: { fontSize: 12, color: Brand.muted, fontWeight: '600' },
  missingChip: { backgroundColor: Brand.surfaceAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  missingChipText: { fontSize: 12, color: Brand.body, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10 },

  noneText: { fontSize: 13, color: Brand.muted, paddingVertical: 10 },
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
