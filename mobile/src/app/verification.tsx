import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/db';
import { pickImage } from '@/lib/images';

type Step = 'id' | 'selfie' | 'skill';

export default function VerificationScreen() {
  const { userId } = useAuth();
  const [docs, setDocs] = useState<Record<Step, string | null>>({ id: null, selfie: null, skill: null });
  const [submitted, setSubmitted] = useState(false);

  const allDone = !!docs.id && !!docs.selfie;
  const mark = async (s: Step) => {
    const uri = await pickImage();
    if (!uri) return;
    setDocs((p) => ({ ...p, [s]: uri }));
    if (userId) uploadImage('verification', `${userId}/${s}.jpg`, uri); // private bucket
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.flex, styles.center]} edges={['top']}>
        <View style={styles.bigIcon}>
          <Ionicons name="hourglass" size={40} color={Brand.red} />
        </View>
        <Text style={styles.bigTitle}>Verification submitted</Text>
        <Text style={styles.bigSub}>
          We’re reviewing your documents. You’ll get a “Verified” badge within 1–2 business days.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Get Verified</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={28} color={Brand.green} />
          <Text style={styles.badgeTitle}>Build trust, win more jobs</Text>
          <Text style={styles.badgeSub}>Verified pros get up to 3× more hires. It only takes a few minutes.</Text>
        </View>

        <UploadStep icon="card-outline" title="Government ID" sub="Driver’s permit, passport or national ID" uri={docs.id} onPress={() => mark('id')} />
        <UploadStep icon="camera-outline" title="Selfie check" sub="A quick photo to match your ID" uri={docs.selfie} onPress={() => mark('selfie')} />
        <UploadStep icon="ribbon-outline" title="Trade certificate (optional)" sub="Boosts your profile credibility" uri={docs.skill} onPress={() => mark('skill')} />

        <Pressable
          style={[styles.primaryBtn, !allDone && styles.primaryBtnDisabled]}
          disabled={!allDone}
          onPress={() => setSubmitted(true)}>
          <Text style={styles.primaryBtnText}>Submit for review</Text>
        </Pressable>
        {!allDone && <Text style={styles.hint}>Upload your ID and selfie to continue.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function UploadStep({
  icon, title, sub, uri, onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string; sub: string; uri: string | null; onPress: () => void;
}) {
  const done = !!uri;
  return (
    <Pressable style={[styles.step, done && styles.stepDone]} onPress={onPress}>
      {done ? (
        <Image source={{ uri: uri! }} style={styles.stepThumb} contentFit="cover" />
      ) : (
        <View style={styles.stepIcon}>
          <Ionicons name={icon} size={22} color={Brand.body} />
        </View>
      )}
      <View style={styles.flex}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepSub}>{done ? 'Uploaded ✓ — tap to change' : sub}</Text>
      </View>
      {done ? <Ionicons name="checkmark-circle" size={22} color={Brand.green} /> : <Ionicons name="cloud-upload-outline" size={22} color={Brand.red} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  badge: { alignItems: 'center', backgroundColor: '#F1FBF5', borderRadius: 16, padding: 20, marginBottom: 20 },
  badgeTitle: { fontSize: 17, fontWeight: '800', color: Brand.ink, marginTop: 10 },
  badgeSub: { fontSize: 13, color: Brand.body, textAlign: 'center', marginTop: 6, lineHeight: 19 },

  step: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 16, marginBottom: 12 },
  stepDone: { borderColor: Brand.green, backgroundColor: '#F7FCF9' },
  stepIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepThumb: { width: 46, height: 46, borderRadius: 12, backgroundColor: Brand.surfaceAlt },
  stepTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  stepSub: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  primaryBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  primaryBtnDisabled: { backgroundColor: '#F0B9BC' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: { color: Brand.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },

  bigIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Brand.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  bigTitle: { fontSize: 22, fontWeight: '800', color: Brand.ink },
  bigSub: { fontSize: 15, color: Brand.muted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});
