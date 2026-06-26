import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ambient, Card, type IconName } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

const PERKS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'people', title: 'Add employees', desc: 'Invite staff to respond to clients and get assigned to jobs for your business.' },
  { icon: 'document-text', title: 'Branded invoices & quotes', desc: 'Your logo, colours and price book on professional PDFs.' },
  { icon: 'people-circle', title: 'Client hub (CRM)', desc: 'Keep client contacts, site locations and project photos in one place.' },
  { icon: 'cash', title: 'Expenses & profit', desc: 'Track job costs and see your real net profit per job.' },
];

export default function UpgradeScreen() {
  const { myProfile } = useStore();
  const premium = !!myProfile?.isPremium;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Premium</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.hero}>
          <View style={styles.crown}><Ionicons name="star" size={26} color="#fff" /></View>
          <Text style={styles.heroTitle}>Trini Side Hustle Premium</Text>
          <Text style={styles.heroSub}>Run your whole trade business from your phone — team, invoices, clients and profit.</Text>
        </View>

        <View style={{ gap: 12, marginTop: 8 }}>
          {PERKS.map((p) => (
            <Card key={p.title} style={styles.perk}>
              <View style={styles.perkIcon}><Ionicons name={p.icon} size={20} color={Brand.red} /></View>
              <View style={styles.grow}>
                <Text style={styles.perkTitle}>{p.title}</Text>
                <Text style={styles.perkDesc}>{p.desc}</Text>
              </View>
            </Card>
          ))}
        </View>

        {premium ? (
          <View style={styles.activeCard}>
            <Ionicons name="checkmark-circle" size={20} color={Brand.green} />
            <Text style={styles.activeText}>You're on Premium. All features unlocked.</Text>
          </View>
        ) : (
          <>
            <Pressable style={styles.cta} disabled>
              <Text style={styles.ctaText}>Subscribe — TT$99 / month</Text>
            </Pressable>
            <Text style={styles.note}>Secure in-app billing via WiPay is coming soon. Pricing shown is indicative.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  hero: { alignItems: 'center', paddingVertical: 16 },
  crown: { width: 60, height: 60, borderRadius: 30, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Brand.ink },
  heroSub: { fontSize: 14, color: Brand.muted, textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 10 },

  perk: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  perkIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Brand.redSoft, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  perkTitle: { fontSize: 15, fontWeight: '800', color: Brand.ink },
  perkDesc: { fontSize: 12.5, color: Brand.muted, marginTop: 2, lineHeight: 17 },

  cta: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, opacity: 0.6 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  note: { fontSize: 12, color: Brand.muted, textAlign: 'center', marginTop: 12, lineHeight: 17 },

  activeCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1FBF5', borderRadius: 14, padding: 16, marginTop: 24 },
  activeText: { flex: 1, fontSize: 14, color: Brand.body, fontWeight: '700' },
});
