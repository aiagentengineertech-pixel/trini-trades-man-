import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchReviewsGiven, type ReviewGiven } from '@/lib/db';

export default function MyReviewsScreen() {
  const { userId } = useAuth();
  const [reviews, setReviews] = useState<ReviewGiven[]>([]);

  useEffect(() => { if (userId) fetchReviewsGiven(userId).then(setReviews); }, [userId]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : '—';

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Reviews I've Given</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {reviews.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={32} color={Brand.muted} />
            <Text style={styles.emptyText}>You haven't left any reviews yet.</Text>
            <Text style={styles.emptySub}>After a tradesman completes a job, you can rate and review them.</Text>
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.bigNum}>{avg}</Text>
              <View style={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name={i < Math.round(Number(avg)) ? 'star' : 'star-outline'} size={18} color={Brand.star} />
                ))}
              </View>
              <Text style={styles.summarySub}>{reviews.length} review{reviews.length === 1 ? '' : 's'} given</Text>
            </View>

            {reviews.map((r, i) => (
              <View key={i} style={styles.review}>
                <View style={styles.reviewHead}>
                  <View style={styles.reviewerAvatar}>
                    <Ionicons name="person" size={18} color={Brand.muted} />
                  </View>
                  <View style={styles.grow}>
                    <Text style={styles.author}>{r.proName}</Text>
                    <Text style={styles.job}>{r.date}</Text>
                  </View>
                  <View style={styles.starsSmall}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Ionicons key={s} name={s < r.stars ? 'star' : 'star-outline'} size={13} color={Brand.star} />
                    ))}
                  </View>
                </View>
                {!!r.text && <Text style={styles.text}>{r.text}</Text>}
              </View>
            ))}
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

  empty: { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyText: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  emptySub: { fontSize: 13, color: Brand.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 20 },

  summary: { alignItems: 'center', backgroundColor: Brand.surfaceAlt, borderRadius: 16, paddingVertical: 22, marginBottom: 20 },
  bigNum: { fontSize: 44, fontWeight: '800', color: Brand.ink },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  summarySub: { fontSize: 13, color: Brand.muted, marginTop: 6 },

  review: { borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 14, marginBottom: 12 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  author: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  job: { fontSize: 12, color: Brand.muted, marginTop: 1 },
  starsSmall: { flexDirection: 'row', gap: 1 },
  text: { fontSize: 13, color: Brand.body, lineHeight: 19 },
});
