import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';

const REVIEWS = [
  { author: 'Marcus R.', stars: 5, text: 'Fast and professional. Fixed my breaker same day.', job: 'Electrical repair', date: '2 weeks ago' },
  { author: 'Aaliyah K.', stars: 5, text: 'Great work installing my ceiling fans. Fair price and very tidy.', job: 'Ceiling fans', date: '1 month ago' },
  { author: 'Devon P.', stars: 4, text: 'Good job overall, arrived a little late but quality work.', job: 'Outlet install', date: '1 month ago' },
];

const avg = (REVIEWS.reduce((s, r) => s + r.stars, 0) / REVIEWS.length).toFixed(1);

export default function MyReviewsScreen() {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>My Reviews</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.summary}>
          <Text style={styles.bigNum}>{avg}</Text>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons key={i} name={i < Math.round(Number(avg)) ? 'star' : 'star-outline'} size={18} color={Brand.star} />
            ))}
          </View>
          <Text style={styles.summarySub}>{REVIEWS.length} reviews</Text>
        </View>

        {REVIEWS.map((r, i) => (
          <View key={i} style={styles.review}>
            <View style={styles.reviewHead}>
              <View style={styles.reviewerAvatar}>
                <Ionicons name="person" size={18} color={Brand.muted} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.author}>{r.author}</Text>
                <Text style={styles.job}>{r.job} · {r.date}</Text>
              </View>
              <View style={styles.starsSmall}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Ionicons key={s} name={s < r.stars ? 'star' : 'star-outline'} size={13} color={Brand.star} />
                ))}
              </View>
            </View>
            <Text style={styles.text}>{r.text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  summary: { alignItems: 'center', backgroundColor: Brand.surfaceAlt, borderRadius: 16, paddingVertical: 22, marginBottom: 20 },
  bigNum: { fontSize: 44, fontWeight: '800', color: Brand.ink },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  summarySub: { fontSize: 13, color: Brand.muted, marginTop: 6 },

  review: { borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 14, marginBottom: 12 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  author: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  job: { fontSize: 12, color: Brand.muted, marginTop: 1 },
  starsSmall: { flexDirection: 'row', gap: 1 },
  text: { fontSize: 13, color: Brand.body, lineHeight: 19 },
});
