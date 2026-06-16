import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ambient, Badge, Card, Glass, Segmented, SectionTitle, StatCard, type IconName } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { fetchPortfolio, fetchProReviews } from '@/lib/db';
import { useStore } from '@/lib/store';
import type { PortfolioItem, Review } from '@/lib/store-types';

interface Cert { name: string; issuer: string; status: 'verified' | 'expiring'; expiry: string; }
interface Price { service: string; price: string; }

const SORTS = ['Newest', 'Highest', 'Relevant'];

export default function ProProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPro } = useStore();
  const pro = getPro(id);
  const [readMore, setReadMore] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sort, setSort] = useState('Newest');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    fetchProReviews(id).then(setReviews);
    fetchPortfolio(id).then(setPortfolio);
  }, [id]);

  if (!pro) {
    return (
      <SafeAreaView style={styles.flex}><Text style={{ padding: 24 }}>Tradesman not found.</Text></SafeAreaView>
    );
  }

  // Featured pros are demo listings — to actually engage a pro, post a job and
  // receive real quotes (real messaging happens in the job/bid flow).
  const message = (_initial?: string) => router.push('/post');

  // Display data for the rich profile (mocked per pro for the prototype).
  const yearsExp = 12;
  const responseTime = '15 minutes';
  const services = pro.services.concat(['Emergency call-outs', 'Free estimates']);
  const certs: Cert[] = [
    { name: 'Trade Licence', issuer: 'T&T Board', status: 'verified', expiry: 'Valid till 2028' },
    { name: 'Liability Insurance', issuer: 'Guardian', status: 'verified', expiry: 'Valid till 2027' },
    { name: 'Safety Certificate', issuer: 'OSHA T&T', status: 'expiring', expiry: 'Expires Aug 2026' },
  ];
  const pricing: Price[] = [
    { service: 'Call-out fee', price: 'TT$200' },
    { service: `${pro.trade} — standard job`, price: 'from TT$400' },
    { service: 'Emergency (after hours)', price: 'TT$600' },
  ];

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
          <View style={[styles.avatar, { backgroundColor: pro.bg }]}>
            <Ionicons name={pro.icon} size={48} color={pro.color} />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{pro.name}</Text>
          </View>
          <Text style={styles.trade}>{pro.trade} · {pro.area}</Text>
          <View style={styles.goldBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#B8860B" />
            <Text style={styles.goldText}>Gold Verified</Text>
          </View>
          <View style={styles.headlineRow}>
            <View style={styles.headlineItem}>
              <View style={styles.starsRow}>
                <Ionicons name="star" size={14} color={Brand.star} />
                <Text style={styles.headlineNum}>{pro.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.headlineLbl}>{pro.reviewsCount} reviews</Text>
            </View>
            <View style={styles.headlineDivider} />
            <View style={styles.headlineItem}>
              <Text style={styles.headlineNum}>{yearsExp} yrs</Text>
              <Text style={styles.headlineLbl}>experience</Text>
            </View>
            <View style={styles.headlineDivider} />
            <View style={styles.headlineItem}>
              <Text style={styles.headlineNum}>~15 min</Text>
              <Text style={styles.headlineLbl}>response</Text>
            </View>
          </View>
        </View>

        {/* ===== Availability ===== */}
        <View style={styles.section}>
          <Card style={styles.availCard}>
            <View style={styles.availDot} />
            <Text style={styles.availText}>Available Now</Text>
            <Text style={styles.availSub}>· Usually responds within {responseTime}</Text>
          </Card>
        </View>

        {/* ===== Business stats ===== */}
        <View style={[styles.section, styles.statsRow]}>
          <StatCard value={`${pro.jobsDone}`} label="Jobs Done" icon="checkmark-done" tint="#2EA84F" bg="#E9F8EE" />
          <StatCard value="98%" label="Response" icon="flash" />
          <StatCard value="96%" label="Completion" icon="ribbon" tint="#2F6FED" bg="#EAF1FE" />
          <StatCard value="64%" label="Repeat" icon="repeat" tint="#8B5CF6" bg="#F1ECFE" />
        </View>

        {/* ===== About ===== */}
        <View style={styles.section}>
          <SectionTitle title="About" />
          <Card>
            <Text style={styles.about} numberOfLines={readMore ? undefined : 3}>
              {pro.bio} We pride ourselves on quality workmanship, fair pricing, and showing up on
              time. Fully licensed and insured, serving homes and businesses across Trinidad & Tobago
              with a satisfaction guarantee on every job.
            </Text>
            <Pressable onPress={() => setReadMore((r) => !r)}>
              <Text style={styles.readMore}>{readMore ? 'Read less' : 'Read more'}</Text>
            </Pressable>
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

        {/* ===== Service areas (map) ===== */}
        <View style={styles.section}>
          <SectionTitle title="Service Areas" />
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={styles.map}>
              <View style={[styles.mapPin, { top: 30, left: 60 }]}><Ionicons name="location" size={22} color={Brand.red} /></View>
              <View style={[styles.mapPin, { top: 70, left: 150 }]}><Ionicons name="location" size={16} color={Brand.red} /></View>
              <View style={[styles.mapPin, { top: 50, left: 230 }]}><Ionicons name="location" size={16} color={Brand.red} /></View>
              <View style={styles.mapRadius} />
            </View>
            <View style={styles.mapInfo}>
              <View style={styles.mapInfoRow}>
                <Ionicons name="navigate-circle-outline" size={18} color={Brand.body} />
                <Text style={styles.mapInfoText}>Primary: <Text style={{ fontWeight: '700' }}>{pro.area}</Text></Text>
              </View>
              <View style={styles.mapInfoRow}>
                <Ionicons name="resize-outline" size={18} color={Brand.body} />
                <Text style={styles.mapInfoText}>Travel radius: <Text style={{ fontWeight: '700' }}>25 km</Text></Text>
              </View>
              <Badge label="Island-wide for large jobs" color={Brand.green} icon="checkmark-circle" />
            </View>
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

        {/* ===== Certifications ===== */}
        <View style={styles.section}>
          <SectionTitle title="Certifications & Insurance" />
          <Card style={{ paddingVertical: 4 }}>
            {certs.map((c, i) => (
              <View key={c.name} style={[styles.certRow, i < certs.length - 1 && styles.divider]}>
                <View style={styles.certIcon}><Ionicons name="document-text" size={18} color={Brand.body} /></View>
                <View style={styles.flex}>
                  <Text style={styles.certName}>{c.name}</Text>
                  <Text style={styles.certIssuer}>{c.issuer} · {c.expiry}</Text>
                </View>
                <Badge label={c.status === 'verified' ? 'Verified' : 'Expiring'} color={c.status === 'verified' ? Brand.green : Brand.star} icon={c.status === 'verified' ? 'checkmark-circle' : 'time'} />
              </View>
            ))}
          </Card>
        </View>

        {/* ===== Pricing ===== */}
        <View style={styles.section}>
          <SectionTitle title="Pricing" />
          <Card style={{ paddingVertical: 4 }}>
            {pricing.map((p, i) => (
              <View key={p.service} style={[styles.priceRow, i < pricing.length - 1 && styles.divider]}>
                <Text style={styles.priceService}>{p.service}</Text>
                <Text style={styles.priceValue}>{p.price}</Text>
              </View>
            ))}
            <Pressable style={styles.quoteBtn} onPress={() => message(`Hi ${pro.name}, could you send me a quote for a job?`)}>
              <Ionicons name="document-text-outline" size={18} color={Brand.red} />
              <Text style={styles.quoteBtnText}>Request a custom quote</Text>
            </Pressable>
          </Card>
        </View>

        {/* ===== Trust & verification ===== */}
        <View style={styles.section}>
          <SectionTitle title="Trust & Verification" />
          <Card>
            <View style={styles.trustHead}>
              <Ionicons name="ribbon" size={22} color="#B8860B" />
              <Text style={styles.trustLevel}>Gold Verified</Text>
              <Text style={styles.trustNext}>1 step from Platinum</Text>
            </View>
            {[
              ['Phone verified', true], ['Email verified', true], ['Government ID', true],
              ['Business registration', true], ['Trade certification', true],
              ['Insurance verified', true], ['Background check', false],
            ].map(([label, ok], i, arr) => (
              <View key={label as string} style={[styles.trustRow, i < arr.length - 1 && styles.divider]}>
                <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={ok ? Brand.green : Brand.muted} />
                <Text style={[styles.trustItemText, !ok && { color: Brand.muted }]}>{label as string}</Text>
              </View>
            ))}
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
        <Pressable style={styles.iconAction} onPress={() => message()}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={Brand.red} />
        </Pressable>
        <Pressable style={styles.iconAction}>
          <Ionicons name="call-outline" size={22} color={Brand.red} />
        </Pressable>
        <Pressable style={styles.hireBtn} onPress={() => message(`Hi ${pro.name}, I'd like to hire you for a job.`)}>
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
  goldBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FBF3DD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  goldText: { color: '#9A6B00', fontWeight: '800', fontSize: 12 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, backgroundColor: Brand.surfaceAlt, borderRadius: 16, paddingVertical: 14, alignSelf: 'stretch', marginHorizontal: 20 },
  headlineItem: { flex: 1, alignItems: 'center' },
  headlineDivider: { width: 1, height: 28, backgroundColor: Brand.line },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  headlineNum: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  headlineLbl: { fontSize: 11, color: Brand.muted, marginTop: 2 },

  availCard: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  availDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Brand.green },
  availText: { fontSize: 15, fontWeight: '800', color: Brand.green },
  availSub: { fontSize: 12, color: Brand.muted, flexShrink: 1 },

  statsRow: { flexDirection: 'row', gap: 10 },

  about: { fontSize: 14, color: Brand.body, lineHeight: 21 },
  readMore: { color: Brand.red, fontWeight: '700', fontSize: 13, marginTop: 8 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Brand.surfaceAlt, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  chipText: { fontSize: 13, color: Brand.body, fontWeight: '600' },

  map: { height: 140, backgroundColor: '#EAF1EE', position: 'relative' },
  mapPin: { position: 'absolute' },
  mapRadius: { position: 'absolute', top: 10, left: 30, width: 130, height: 110, borderRadius: 65, borderWidth: 2, borderColor: 'rgba(225,29,38,0.3)', backgroundColor: 'rgba(225,29,38,0.06)' },
  mapInfo: { padding: 16, gap: 10 },
  mapInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapInfoText: { fontSize: 14, color: Brand.body },

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

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  priceService: { fontSize: 14, color: Brand.ink },
  priceValue: { fontSize: 14, fontWeight: '800', color: Brand.ink },
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
  iconAction: { width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  hireBtn: { flex: 1, borderRadius: 16, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  hireText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
