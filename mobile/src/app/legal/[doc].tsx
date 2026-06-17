import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { getLegalDoc } from '@/constants/legal';

// Renders the lightweight markup used in legal bodies:
//   "## Heading"  -> section heading
//   "- bullet"    -> bullet line
//   blank line    -> paragraph break
//   anything else -> paragraph
function renderBody(body: string) {
  const lines = body.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <Text key={i} style={styles.heading}>{line.slice(3)}</Text>;
    }
    if (line.startsWith('- ')) {
      return (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{line.slice(2)}</Text>
        </View>
      );
    }
    if (line.trim() === '') {
      return <View key={i} style={styles.spacer} />;
    }
    return <Text key={i} style={styles.paragraph}>{line}</Text>;
  });
}

export default function LegalDocScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const item = doc ? getLegalDoc(doc) : undefined;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{item?.title ?? 'Legal'}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {item ? (
          <Fragment>
            <Text style={styles.docTitle}>{item.title}</Text>
            <Text style={styles.updated}>Last updated {item.updated}</Text>
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={16} color={Brand.muted} />
              <Text style={styles.noticeText}>
                This is a general policy provided for transparency. It is not legal advice.
              </Text>
            </View>
            {renderBody(item.body)}
          </Fragment>
        ) : (
          <Text style={styles.paragraph}>This document could not be found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Brand.ink, marginHorizontal: 8 },

  docTitle: { fontSize: 24, fontWeight: '800', color: Brand.ink },
  updated: { fontSize: 12.5, color: Brand.muted, marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.surfaceAlt, borderRadius: 10, padding: 10, marginTop: 14 },
  noticeText: { flex: 1, fontSize: 12, color: Brand.muted, lineHeight: 16 },

  heading: { fontSize: 16, fontWeight: '800', color: Brand.ink, marginTop: 22, marginBottom: 6 },
  paragraph: { fontSize: 14.5, color: Brand.body, lineHeight: 22 },
  spacer: { height: 10 },
  bulletRow: { flexDirection: 'row', gap: 8, marginTop: 4, paddingRight: 4 },
  bulletDot: { fontSize: 14.5, color: Brand.muted, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14.5, color: Brand.body, lineHeight: 22 },
});
