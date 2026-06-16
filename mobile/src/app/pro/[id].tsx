import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ambient, Card, Glass, ProAvatar, Segmented, SectionTitle, StatCard, type IconName } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchPortfolio, fetchProReviews, fetchProStats } from '@/lib/db';
import { useStore } from '@/lib/store';
import type { PortfolioItem, ProStats, Review } from '@/lib/store-types';

const SORTS = ['Newest', 'Highest', 'Relevant'];

export default function ProProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPro, startConversation, distanceKm } = useStore();
  const { userId } = useAuth();
  const pro = getPro(id);
  const [readMore, setReadMore] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sort, setSort] = useState('Newest');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [stats, setStats] = useState<ProStats | null>(null);

  useEffect(() => {
    fetchProReviews(id).then(setReviews);
    fetchPortfolio(id).then(setPortfolio);
    fetchProStats(id).then(setStats);
  }, [id]);

  if (!pro) {
    return (
      <SafeAreaView style={styles.flex}><Text style={{ padding: 24 }}>Tradesman not found.</Text></SafeAreaView>
    );
  }

  // Message → open a real in-app conversation with this tradesman.
  const openChat = async () => {
    if (!userId) { router.push('/login'); return; }
    const cid = await startConversation(userId, pro.id, null);
    if (cid) router.push({ pathname: '/chat/[id]', params: { id: cid } });
  };

  // Hire Now / Request a quote → post a job with this pro invited to quote.
  const invite = () =>
    router.push({ pathname: '/post', params: { trade: pro.trade, invitePro: pro.id, invitePname: pro.name } });

  // Real, data-backed figures (null/0 until there's activity — shown honestly).
  const years = stats?.yearsExperience ?? pro.yearsExperience ?? null;
  const respMins = stats?.avgResponseMins ?? null;
  const respLabel = respMins != null ? `~${respMins} min` : 'New';
  const radiusKm = stats?.serviceRadiusKm ?? 25;
  const services = pro.services.length ? pro.services : [pro.trade];
  const distKm = distanceKm(pro.lat, pro.lng);

  return (
    <View style={styles.root}>
      <Ambient />
      <SafeAreaView style={styles.flex} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable style={styles.circleBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Brand.ink} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable style={styles.circleBtn} onPress={() => setSaved((s) => !s)} hitSlop={8}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? Brand.red : Brand.ink} />
          </Pressable>
          <Pressable style={styles.circleBtn} hitSlop={8}>
            <Ionicons name="share-outline" size={20} color={Brand.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* ===== Header ===== */}
        <View style={styles.header}>
          <ProAvatar photoUrl={pro.photoUrl} icon={pro.icon} color={pro.color} bg={pro.bg} iconSize={48} style={styles.avatar} />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{pro.name}</Text>
          </View>
          <Text style={styles.trade}>{pro.trade} · {pro.area}</Text>
          {pro.verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Brand.green} />
              <Text style={styles.verifiedBadgeText}>Verified Pro</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={14} color={Brand.muted} />
              <Text style={styles.pendingBadgeText}>Verification pending</Text>
            </View>
          )}
          <View style={styles.headlineRow}>
            <View style={styles.headlineItem}>
              <View style={styles.starsRow}>
                <Ionicons name="star" size={14} color={Brand.star} />
                <Text style={styles.headlineNum}>{pro.reviewsCount > 0 ? pro.rating.toFixed(1) : 'New'}</Text>
              </View>
              <Text style={styles.headlineLbl}>{pro.reviewsCount} review{pro.reviewsCount === 1 ? '' : 's'}</Text>
            </View>
            <View style={styles.headlineDivider} />
            <View style={styles.headlineItem}>
              <Text style={styles.headlineNum}>{years != null ? `${years} yr${years === 1 ? '' : 's'}` : 'New'}</Text>
              <Text style={styles.headlineLbl}>experience</Text>
            </View>
            <View style={styles.headlineDivider} />
            <View style={styles.headlineItem}>
              <Text style={styles.headlineNum}>{respLabel}</Text>
              <Text style={styles.headlineLbl}>response</Text>
            </View>
          </View>
        </View>

        {/* ===== Availability ===== */}
        <View style={styles.section}>
          <Card style={styles.availCard}>
            <Ionicons name="time-outline" size={18} color={Brand.body} />
            <Text style={styles.availText}>
              {respMins != null ? `Usually responds in ~${respMins} min` : 'New to Trini Tradesman'}
            </Text>
          </Card>
        </View>

        {/* ===== Business stats (real) ===== */}
        <View style={[styles.section, styles.statsRow]}>
          <StatCard value={`${stats?.jobsDone ?? 0}`} label="Jobs Done" icon="checkmark-done" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value={`${stats?.hiredCount ?? 0}`} label="Hired" icon="briefcase" />
          <StatCard value={stats?.responseRate != null ? `${stats.responseRate}%` : '—'} label="Response" icon="flash" tint="#2F6FED" bg="#EAF1FE" />
          <StatCard value={stats?.repeatRate != null ? `${stats.repeatRate}%` : '—'} label="Repeat" icon="repeat" tint="#8B5CF6" bg="#F1ECFE" />
        </View>

        {/* ===== About ===== */}
        <View style={styles.section}>
          <SectionTitle title="About" />
          <Card>
            <Text style={styles.about} numberOfLines={readMore ? undefined : 4}>{pro.bio}</Text>
            {pro.bio.length > 140 && (
              <Pressable onPress={() => setReadMore((r) => !r)}>
                <Text style={styles.readMore}>{readMore ? 'Read less' : 'Read more'}</Text>
              </Pressable>
            )}
          </Card>
        </View>

        {/* ===== Services ===== */}
        <View style={styles.section}>
          <SectionTitle title="Services Offered" />
          <View style={styles.chips}>
            {services.map((s) => (
              <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
            ))}
          </View>
        </View>

        {/* ===== Service area (coverage card) ===== */}
        <View style={styles.section}>
          <SectionTitle title="Service Area" />
          <Card>
            <View style={styles.coverHead}>
              <View style={styles.coverRingOuter}>
                <View style={styles.coverRingInner}>
                  <Ionicons name="location" size={20} color={Brand.red} />
                </View>
              </View>
              <View style={styles.flex}>
                <Text style={styles.coverArea}>{pro.area}</Text>
                <Text style={styles.coverSub}>Primary service area</Text>
              </View>
            </View>
            <View style={styles.coverRow}>
              <Ionicons name="resize-outline" size={18} color={Brand.body} />
              <Text style={styles.coverText}>Covers jobs within <Text style={{ fontWeight: '700' }}>{radiusKm} km</Text></Text>
            </View>
            {distKm != null && (
              <View style={styles.coverRow}>
                <Ionicons name="navigate-outline" size={18} color={Brand.body} />
                <Text style={styles.coverText}>
                  About <Text style={{ fontWeight: '700' }}>{distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}</Text> from you
                  {distKm <= radiusKm ? ' · in their service area' : ''}
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* ===== Portfolio ===== */}
        {portfolio.length > 0 && (
          <View style={styles.section}>
            <SectionTitle title="Portfolio" />
            <View style={{ gap: 14 }}>
              {portfolio.map((p) => (
                <Card key={p.id} style={{ padding: 0, overflow: 'hidden' }}>
                  <View style={styles.beforeAfter}>
                    <View style={styles.baHalf}>
                      {p.beforeUrl ? <Image source={{ uri: p.beforeUrl }} style={styles.baImg} contentFit="cover" /> : <View style={[styles.baImg, styles.baEmpty]}><Ionicons name="image-outline" size={26} color={Brand.muted} /></View>}
                      <View style={styles.baTag}><Text style={styles.baTagText}>BEFORE</Text></View>
                    </View>
                    <View style={styles.baHalf}>
                      {p.afterUrl ? <Image source={{ uri: p.afterUrl }} style={styles.baImg} contentFit="cover" /> : <View style={[styles.baImg, styles.baEmpty]}><Ionicons name="image-outline" size={26} color={Brand.muted} /></View>}
                      <View style={[styles.baTag, { backgroundColor: Brand.green }]}><Text style={styles.baTagText}>AFTER</Text></View>
                    </View>
                  </View>
                  <View style={styles.portInfo}>
                    <Text style={styles.portTitle}>{p.title}</Text>
                    <View style={styles.portMeta}>
                      {!!p.value && <Text style={styles.portValue}>{p.value}</Text>}
                      <Text style={styles.portDate}>{p.date}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* ===== Pricing (quote-based model) ===== */}
        <View style={styles.section}>
          <SectionTitle title="Pricing" />
          <Card>
            <View style={styles.priceNoteRow}>
              <Ionicons name="pricetag-outline" size={18} color={Brand.body} />
              <Text style={styles.priceNote}>Pricing is quote-based — you get a price for your exact job, with payment held safely in escrow until it's done.</Text>
            </View>
            <Pressable style={styles.quoteBtn} onPress={invite}>
              <Ionicons name="document-text-outline" size={18} color={Brand.red} />
              <Text style={styles.quoteBtnText}>Request a custom quote</Text>
            </Pressable>
          </Card>
        </View>

        {/* ===== Verification (real) ===== */}
        <View style={styles.section}>
          <SectionTitle title="Verification" />
          <Card style={{ paddingVertical: 4 }}>
            <View style={[styles.trustRow, styles.divider]}>
              <Ionicons name={pro.verified ? 'shield-checkmark' : 'time-outline'} size={18} color={pro.verified ? Brand.green : Brand.muted} />
              <Text style={styles.trustItemText}>
                {pro.verified ? 'Identity & trade verified by Trini Tradesman' : 'Verification pending'}
              </Text>
            </View>
            {stats?.memberSince != null && (
              <View style={[styles.trustRow, styles.divider]}>
                <Ionicons name="calendar-outline" size={18} color={Brand.body} />
                <Text style={styles.trustItemText}>Member since {stats.memberSince}</Text>
              </View>
            )}
            {years != null && (
              <View style={[styles.trustRow, styles.divider]}>
                <Ionicons name="briefcase-outline" size={18} color={Brand.body} />
                <Text style={styles.trustItemText}>{years} year{years === 1 ? '' : 's'} of experience</Text>
              </View>
            )}
            <View style={styles.trustRow}>
              <Ionicons name="checkmark-done" size={18} color={Brand.body} />
              <Text style={styles.trustItemText}>{stats?.hiredCount ?? 0} job{(stats?.hiredCount ?? 0) === 1 ? '' : 's'} hired via Trini Tradesman</Text>
            </View>
          </Card>
        </View>

        {/* ===== Reviews ===== */}
        <View style={styles.section}>
          <SectionTitle title={`Reviews (${reviews.length})`} />
          {reviews.length === 0 ? (
            <Card>
              <Text style={styles.noReviews}>No reviews yet — be the first to hire and review {pro.name}.</Text>
            </Card>
          ) : (
            <>
              <Segmented options={SORTS} value={sort} onChange={setSort} />
              <View style={{ gap: 12, marginTop: 12 }}>
                {reviews.map((r, i) => (
                  <Card key={i}>
                    <View style={styles.revHead}>
                      <View style={styles.revAvatar}><Ionicons name="person" size={16} color={Brand.muted} /></View>
                      <View style={styles.flex}>
                        <Text style={styles.revAuthor}>{r.author}</Text>
                        <Text style={styles.revDate}>{pro.trade} · {r.date}</Text>
                      </View>
                      <View style={styles.revStars}>
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Ionicons key={s} name={s < r.stars ? 'star' : 'star-outline'} size={12} color={Brand.star} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.revText}>{r.text}</Text>
                  </Card>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ===== Sticky action bar ===== */}
      <Glass intensity={55} style={styles.actionBar}>
        <Pressable style={styles.messageBtn} onPress={openChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Brand.red} />
          <Text style={styles.messageText}>Message</Text>
        </Pressable>
        <Pressable style={styles.hireBtn} onPress={invite}>
          <Ionicons name="briefcase" size={18} color="#fff" />
          <Text style={styles.hireText}>Hire Now</Text>
        </Pressable>
      </Glass>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.surface },
  flex: { flex: 1, backgroundColor: 'transparent' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 20, marginTop: 22 },

  header: { alignItems: 'center', paddingTop: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 23, fontWeight: '800', color: Brand.ink, letterSpacing: -0.3, textAlign: 'center' },
  trade: { fontSize: 14, color: Brand.muted, marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E9F8EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  verifiedBadgeText: { color: Brand.green, fontWeight: '800', fontSize: 12 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Brand.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  pendingBadgeText: { color: Brand.muted, fontWeight: '800', fontSize: 12 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, backgroundColor: Brand.surfaceAlt, borderRadius: 16, paddingVertical: 14, alignSelf: 'stretch', marginHorizontal: 20 },
  headlineItem: { flex: 1, alignItems: 'center' },
  headlineDivider: { width: 1, height: 28, backgroundColor: Brand.line },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  headlineNum: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  headlineLbl: { fontSize: 11, color: Brand.muted, marginTop: 2 },

  availCard: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  availText: { fontSize: 14, fontWeight: '700', color: Brand.ink, flexShrink: 1 },

  statsRow: { flexDirection: 'row', gap: 10 },

  about: { fontSize: 14, color: Brand.body, lineHeight: 21 },
  readMore: { color: Brand.red, fontWeight: '700', fontSize: 13, marginTop: 8 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Brand.surfaceAlt, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  chipText: { fontSize: 13, color: Brand.body, fontWeight: '600' },

  coverHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  coverRingOuter: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(225,29,38,0.08)', alignItems: 'center', justifyContent: 'center' },
  coverRingInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(225,29,38,0.14)', alignItems: 'center', justifyContent: 'center' },
  coverArea: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  coverSub: { fontSize: 12, color: Brand.muted, marginTop: 2 },
  coverRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  coverText: { flex: 1, fontSize: 14, color: Brand.body },

  beforeAfter: { flexDirection: 'row', height: 130 },
  baHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  baImg: { width: '100%', height: '100%' },
  baEmpty: { backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  baTag: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(14,17,22,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  baTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  portInfo: { padding: 14 },
  portTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  portMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  portValue: { fontSize: 14, fontWeight: '800', color: Brand.red },
  portDate: { fontSize: 12, color: Brand.muted },

  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  certIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  certName: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  certIssuer: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  priceNoteRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  priceNote: { flex: 1, fontSize: 13, color: Brand.body, lineHeight: 19 },
  quoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 6 },
  quoteBtnText: { color: Brand.red, fontWeight: '700', fontSize: 14 },

  trustHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  trustLevel: { fontSize: 16, fontWeight: '800', color: Brand.ink, flex: 1 },
  trustNext: { fontSize: 11, color: Brand.muted },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  trustItemText: { fontSize: 14, color: Brand.ink },

  revHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  revAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  revAuthor: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  revDate: { fontSize: 11, color: Brand.muted, marginTop: 1 },
  revStars: { flexDirection: 'row', gap: 1 },
  revText: { fontSize: 13, color: Brand.body, lineHeight: 19 },
  noReviews: { fontSize: 13, color: Brand.muted, lineHeight: 19 },

  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.7)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.6)',
  },
  messageBtn: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: Brand.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  messageText: { color: Brand.red, fontWeight: '800', fontSize: 15 },
  hireBtn: { flex: 1.4, height: 52, borderRadius: 16, backgroundColor: Brand.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hireText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
