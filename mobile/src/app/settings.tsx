import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ambient, Badge, Card, ListRow, SectionTitle, Segmented, ToggleRow } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { ensureNotificationPermission, notifyLocal } from '@/lib/notifications';

export default function SettingsScreen() {
  const { role, setRole, signOut } = useAuth();
  const [notif, setNotif] = useState({ push: true, messages: true, jobs: true, promos: false, emergency: true, payments: true });
  const [twoFa, setTwoFa] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; danger: boolean; action: () => void }>(null);

  const set = (k: keyof typeof notif) => (v: boolean) => setNotif((p) => ({ ...p, [k]: v }));
  const togglePush = (v: boolean) => { set('push')(v); if (v) ensureNotificationPermission(); };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Mode switch (prototype) */}
        <SectionTitle title="Using the app as" />
        <Segmented
          options={['Customer', 'Tradesman']}
          value={role === 'tradesman' ? 'Tradesman' : 'Customer'}
          onChange={(v) => setRole(v === 'Tradesman' ? 'tradesman' : 'customer')}
        />

        {/* Security */}
        <View style={styles.gap} />
        <SectionTitle title="Security & Verification" />
        <Card style={styles.cardTight}>
          <ListRow icon="call-outline" label="Phone verification" right={<Badge label="Verified" icon="checkmark-circle" />} />
          <ListRow icon="mail-outline" label="Email verification" right={<Badge label="Verified" icon="checkmark-circle" />} />
          <ListRow icon="card-outline" label="Government ID" right={<Badge label="Pending" color={Brand.star} icon="time" />} onPress={() => router.push('/verification')} />
          <ToggleRow icon="lock-closed-outline" label="Two-factor authentication" value={twoFa} onValueChange={setTwoFa} />
          <ListRow icon="key-outline" label="Change password" onPress={() => {}} />
          <ListRow icon="time-outline" label="Login history" onPress={() => {}} />
          <ListRow icon="phone-portrait-outline" label="Device management" onPress={() => {}} last />
        </Card>

        {/* Notifications */}
        <View style={styles.gap} />
        <SectionTitle title="Notifications" />
        <Card style={styles.cardTight}>
          <ToggleRow icon="notifications-outline" label="Push notifications" value={notif.push} onValueChange={togglePush} />
          <ToggleRow icon="chatbubble-ellipses-outline" label="Messages" value={notif.messages} onValueChange={set('messages')} />
          <ToggleRow icon="briefcase-outline" label="Job updates" value={notif.jobs} onValueChange={set('jobs')} />
          <ToggleRow icon="pricetag-outline" label="Promotions" value={notif.promos} onValueChange={set('promos')} />
          <ToggleRow icon="warning-outline" label="Emergency alerts" value={notif.emergency} onValueChange={set('emergency')} />
          <ToggleRow icon="cash-outline" label="Payment updates" value={notif.payments} onValueChange={set('payments')} />
          <ListRow icon="send-outline" label="Send a test notification" onPress={() => notifyLocal('Trini Side Hustle', 'Notifications are working 🔔')} last />
        </Card>

        {/* Support */}
        <View style={styles.gap} />
        <SectionTitle title="Support" />
        <Card style={styles.cardTight}>
          <ListRow icon="help-buoy-outline" label="Help Centre" onPress={() => router.push('/help')} />
          <ListRow icon="chatbox-ellipses-outline" label="Contact Support" onPress={() => router.push('/help')} />
          <ListRow icon="flag-outline" label="Report an Issue" onPress={() => router.push('/help')} />
          <ListRow icon="document-text-outline" label="Terms of Service" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })} />
          <ListRow icon="shield-outline" label="Privacy Policy" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })} />
          <ListRow icon="reader-outline" label="Legal & Policies" onPress={() => router.push('/legal')} last />
        </Card>

        {/* Account actions */}
        <View style={styles.gap} />
        <SectionTitle title="Account" />
        <Card style={styles.cardTight}>
          <ListRow icon="pause-circle-outline" label="Deactivate account" onPress={() => setConfirm({ title: 'Deactivate account?', message: 'Your profile will be hidden until you sign back in.', danger: false, action: signOut })} />
          <ListRow icon="trash-outline" label="Delete account" danger onPress={() => router.push('/delete-account')} />
          <ListRow icon="log-out-outline" label="Log out" danger onPress={() => setConfirm({ title: 'Log out?', message: 'You can sign back in anytime.', danger: true, action: signOut })} last />
        </Card>

        <Text style={styles.version}>Trini Side Hustle v1.0.0</Text>
      </ScrollView>

      {/* Confirmation popup */}
      {confirm && (
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{confirm.title}</Text>
            <Text style={styles.dialogMsg}>{confirm.message}</Text>
            <View style={styles.dialogBtns}>
              <Pressable style={styles.cancelBtn} onPress={() => setConfirm(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, confirm.danger && { backgroundColor: Brand.red }]}
                onPress={() => { const a = confirm.action; setConfirm(null); a(); }}>
                <Text style={styles.confirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  gap: { height: 22 },
  cardTight: { paddingVertical: 4 },
  version: { textAlign: 'center', color: Brand.muted, fontSize: 12, marginTop: 28 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  dialog: { backgroundColor: '#fff', borderRadius: 20, padding: 22, width: '100%', maxWidth: 340 },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  dialogMsg: { fontSize: 14, color: Brand.body, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  dialogBtns: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: Brand.surfaceAlt, alignItems: 'center' },
  cancelText: { fontWeight: '700', color: Brand.body, fontSize: 15 },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: Brand.red, alignItems: 'center' },
  confirmText: { fontWeight: '700', color: '#fff', fontSize: 15 },
});
