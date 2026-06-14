import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useStore } from '@/lib/store';

export default function MessagesScreen() {
  const { conversations } = useStore();

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={Brand.muted} />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>When you hire a tradesman or receive a quote, your chats will appear here.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {conversations.map((c) => (
            <Pressable key={c.id} style={styles.row} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}>
              <View style={[styles.avatar, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon} size={24} color={c.color} />
              </View>
              <View style={styles.flex}>
                <View style={styles.topRow}>
                  <Text style={styles.name}>{c.name}</Text>
                  {c.unread > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{c.unread}</Text></View>}
                </View>
                <Text style={styles.last} numberOfLines={1}>{c.lastMessage}</Text>
                <Text style={styles.job}>Re: {c.jobTitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  headerWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  h1: { fontSize: 26, fontWeight: '800', color: Brand.ink },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Brand.line },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  unread: { backgroundColor: Brand.red, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  last: { fontSize: 13, color: Brand.body, marginTop: 3 },
  job: { fontSize: 11, color: Brand.muted, marginTop: 3 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, paddingBottom: 120 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Brand.ink },
  emptySub: { fontSize: 14, color: Brand.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
