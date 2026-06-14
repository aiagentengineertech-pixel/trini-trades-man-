import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';

const FAQ = [
  { q: 'How does payment work?', a: 'When you hire a tradesman, your payment is held securely in escrow by WiPay. The money is only released to the tradesman once you confirm the job is done.' },
  { q: 'How are tradesmen verified?', a: 'Verified pros have submitted a government ID and passed a selfie check. Look for the green “Verified” badge on their profile.' },
  { q: 'What if I’m not happy with the work?', a: 'Contact support before releasing payment. Since funds are held in escrow, we can help mediate and, if needed, issue a refund.' },
  { q: 'How do I get more jobs as a tradesman?', a: 'Complete your profile, get verified, and respond to job quotes quickly. Higher ratings and fast replies win more work.' },
];

const CONTACT: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }[] = [
  { icon: 'mail-outline', label: 'Email us', value: 'support@trinitradesman.tt' },
  { icon: 'logo-whatsapp', label: 'WhatsApp', value: '+1 (868) 555-0123' },
  { icon: 'call-outline', label: 'Call us', value: '+1 (868) 555-0100' },
];

export default function HelpScreen() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.section}>Frequently asked</Text>
        {FAQ.map((item, i) => {
          const expanded = open === i;
          return (
            <Pressable key={i} style={styles.faq} onPress={() => setOpen(expanded ? null : i)}>
              <View style={styles.faqHead}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Brand.muted} />
              </View>
              {expanded && <Text style={styles.faqA}>{item.a}</Text>}
            </Pressable>
          );
        })}

        <Text style={styles.section}>Still need help?</Text>
        {CONTACT.map((c) => (
          <Pressable key={c.label} style={styles.contact}>
            <View style={styles.contactIcon}>
              <Ionicons name={c.icon} size={20} color={Brand.red} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={styles.contactValue}>{c.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  section: { fontSize: 14, fontWeight: '800', color: Brand.ink, marginTop: 8, marginBottom: 12 },
  faq: { borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 16, marginBottom: 10 },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '700', color: Brand.ink },
  faqA: { fontSize: 13, color: Brand.body, lineHeight: 20, marginTop: 10 },

  contact: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Brand.line, borderRadius: 14, padding: 14, marginBottom: 10 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.redSoft, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  contactValue: { fontSize: 13, color: Brand.muted, marginTop: 2 },
});
