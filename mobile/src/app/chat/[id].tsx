import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ambient } from '@/components/ui';

import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { fetchMessages, sendChatMessage, subscribeToMessages } from '@/lib/db';
import { useStore } from '@/lib/store';
import type { Message } from '@/lib/store-types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const { getConversation } = useStore();
  const conv = getConversation(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchMessages(id, userId).then((m) => { if (active) setMessages(m); });
    const unsub = subscribeToMessages(id, userId, (newMsg) => {
      setMessages((prev) => (prev.some((x) => x.id === newMsg.id) ? prev : [...prev, newMsg]));
    });
    return () => { active = false; unsub(); };
  }, [id, userId]);

  const send = async () => {
    if (!text.trim() || !userId) return;
    const body = text.trim();
    setText('');
    await sendChatMessage(id, userId, body);
    const fresh = await fetchMessages(id, userId);
    setMessages(fresh);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        {conv && (
          <View style={styles.headerInfo}>
            <View style={[styles.avatar, { backgroundColor: conv.bg }]}>
              <Ionicons name={conv.icon} size={20} color={conv.color} />
            </View>
            <View>
              <Text style={styles.headerName}>{conv.name}</Text>
              <Text style={styles.headerSub}>{conv.trade}</Text>
            </View>
          </View>
        )}
        <Ionicons name="call-outline" size={22} color={Brand.red} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {conv && (
            <View style={styles.jobBanner}>
              <Ionicons name="briefcase-outline" size={14} color={Brand.muted} />
              <Text style={styles.jobBannerText}>Re: {conv.jobTitle}</Text>
            </View>
          )}
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleRow, m.fromMe ? styles.rowMe : styles.rowThem]}>
              <View style={[styles.bubble, m.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, m.fromMe && { color: '#fff' }]}>{m.text}</Text>
                <Text style={[styles.bubbleTime, m.fromMe && { color: 'rgba(255,255,255,0.7)' }]}>{m.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={Brand.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  headerSub: { fontSize: 12, color: Brand.muted },

  messages: { padding: 16, gap: 10 },
  jobBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  jobBannerText: { fontSize: 12, color: Brand.muted, fontWeight: '600' },

  bubbleRow: { flexDirection: 'row' },
  rowMe: { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: Brand.red, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Brand.surfaceAlt, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: Brand.ink, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: Brand.muted, marginTop: 4, alignSelf: 'flex-end' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },
  input: {
    flex: 1,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    color: Brand.ink,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
});
