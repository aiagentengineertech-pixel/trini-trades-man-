import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ambient } from '@/components/ui';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchNotifications, markNotificationsRead } from '@/lib/db';
import type { Notification } from '@/lib/store-types';

export default function NotificationsScreen() {
  const { userId } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications(userId).then(setItems);
    markNotificationsRead(userId); // mark read on open
  }, [userId]);

  const openNotification = (n: Notification) => {
    if ((n.type === 'bid' || n.type === 'hired') && n.jobId) {
      router.push({ pathname: '/job/[id]', params: { id: n.jobId } });
    } else if (n.type === 'message') {
      router.push('/messages');
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={32} color={Brand.muted} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : (
          items.map((n) => {
            const tappable = ((n.type === 'bid' || n.type === 'hired') && n.jobId) || n.type === 'message';
            return (
              <Pressable
                key={n.id}
                style={[styles.row, n.unread && styles.rowUnread]}
                onPress={() => openNotification(n)}
                disabled={!tappable}>
                <View style={[styles.icon, { backgroundColor: n.bg }]}>
                  <Ionicons name={n.icon} size={20} color={n.color} />
                </View>
                <View style={styles.grow}>
                  <Text style={styles.rowTitle}>{n.title}</Text>
                  <Text style={styles.rowBody}>{n.body}</Text>
                  <Text style={styles.rowTime}>{n.time}</Text>
                </View>
                {n.unread ? <View style={styles.dot} /> : tappable ? <Ionicons name="chevron-forward" size={16} color={Brand.muted} /> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  empty: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { fontSize: 14, color: Brand.muted },

  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Brand.line, alignItems: 'center' },
  rowUnread: { backgroundColor: '#FFF8F8' },
  grow: { flex: 1 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  rowBody: { fontSize: 13, color: Brand.body, marginTop: 2, lineHeight: 18 },
  rowTime: { fontSize: 11, color: Brand.muted, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Brand.red },
});
