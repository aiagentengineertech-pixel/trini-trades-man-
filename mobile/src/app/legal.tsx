import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ambient } from '@/components/ui';

import { Brand } from '@/constants/brand';
import { LEGAL_DOCS, LEGAL_INFO } from '@/constants/legal';

export default function LegalHubScreen() {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Legal & Policies</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {LEGAL_DOCS.map((d, i) => (
            <Pressable
              key={d.key}
              style={[styles.row, i < LEGAL_DOCS.length - 1 && styles.rowBorder]}
              onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: d.key } })}
            >
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{d.title}</Text>
                <Text style={styles.rowSub}>{d.summary}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Brand.muted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>
          {LEGAL_INFO.appName} · {LEGAL_INFO.website}
          {'\n'}Questions? {LEGAL_INFO.email}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  card: { borderWidth: 1, borderColor: Brand.line, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Brand.line },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  rowSub: { fontSize: 12.5, color: Brand.muted, marginTop: 2 },
  footer: { textAlign: 'center', color: Brand.muted, fontSize: 12, marginTop: 24, lineHeight: 18 },
});
