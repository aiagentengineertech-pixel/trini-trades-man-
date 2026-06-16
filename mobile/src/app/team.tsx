import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle } from '@/components/ui';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import {
  acceptTeamInvite, fetchMyAssignments, fetchMyInvites, fetchMyMemberships, fetchTeam,
  inviteTeamMember, leaveTeam, removeTeamMember, type Assignment,
} from '@/lib/db';
import { useStore } from '@/lib/store';
import type { TeamMember } from '@/lib/store-types';

export default function TeamScreen() {
  const { userId, email } = useAuth();
  const { getJob, startConversation } = useStore();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamMember[]>([]);
  const [memberships, setMemberships] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const [t, i, m, a] = await Promise.all([
      fetchTeam(userId), fetchMyInvites(email), fetchMyMemberships(userId), fetchMyAssignments(userId),
    ]);
    setTeam(t);
    setInvites(i);
    setMemberships(m);
    setAssignments(a);
  }, [userId, email]);

  const messageCustomer = async (a: Assignment) => {
    const job = getJob(a.jobId);
    if (!job) return;
    const convId = await startConversation(job.customerId, a.ownerId, a.jobId);
    if (convId) router.push({ pathname: '/chat/[id]', params: { id: convId } });
  };

  useEffect(() => { load(); }, [load]);

  const sendInvite = async () => {
    setError(null); setOkMsg(null);
    if (!userId) return;
    if (!inviteEmail.includes('@')) { setError('Enter a valid email address.'); return; }
    setBusy(true);
    const res = await inviteTeamMember(userId, inviteEmail, inviteName);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'Could not send invite.'); return; }
    setOkMsg(`Invite sent to ${inviteEmail.trim()}. They join by signing up with that email.`);
    setInviteEmail(''); setInviteName('');
    load();
  };

  const accept = async (id: string) => { await acceptTeamInvite(id); load(); };
  const leave = async (id: string) => { await leaveTeam(id); load(); };
  const remove = async (id: string) => { await removeTeamMember(id); load(); };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>Team</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {/* Invites addressed to me */}
          {invites.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <SectionTitle title="Invitations" />
              {invites.map((iv) => (
                <Card key={iv.id} style={styles.inviteCard}>
                  <View style={styles.grow}>
                    <Text style={styles.rowName}>{iv.businessName}</Text>
                    <Text style={styles.rowSub}>invited you to join as an employee</Text>
                  </View>
                  <Pressable style={styles.acceptBtn} onPress={() => accept(iv.id)}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}

          {/* Businesses I belong to */}
          {memberships.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <SectionTitle title="You work with" />
              {memberships.map((m) => (
                <Card key={m.id} style={styles.row}>
                  <View style={styles.avatar}><Ionicons name="business" size={18} color={Brand.ink} /></View>
                  <View style={styles.grow}>
                    <Text style={styles.rowName}>{m.businessName}</Text>
                    <Text style={styles.rowSub}>Employee</Text>
                  </View>
                  <Pressable onPress={() => leave(m.id)} hitSlop={8}><Text style={styles.leaveText}>Leave</Text></Pressable>
                </Card>
              ))}
            </View>
          )}

          {/* Jobs assigned to me */}
          {assignments.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <SectionTitle title="Jobs assigned to you" />
              {assignments.map((a) => {
                const job = getJob(a.jobId);
                return (
                  <Card key={a.id} style={styles.row}>
                    <View style={[styles.avatar, job ? { backgroundColor: job.bg } : null]}>
                      <Ionicons name={job?.icon ?? 'briefcase'} size={18} color={job?.color ?? Brand.body} />
                    </View>
                    <View style={styles.grow}>
                      <Text style={styles.rowName}>{job?.title ?? 'Assigned job'}</Text>
                      <Text style={styles.rowSub}>{job ? `${job.trade} · ${job.area}` : 'Tap message to contact the customer'}</Text>
                    </View>
                    <Pressable style={styles.msgBtn} onPress={() => messageCustomer(a)}>
                      <Ionicons name="chatbubble-ellipses-outline" size={15} color={Brand.red} />
                      <Text style={styles.msgBtnText}>Message</Text>
                    </Pressable>
                  </Card>
                );
              })}
            </View>
          )}

          {/* My team (as owner) */}
          <SectionTitle title="Your team" />
          <Card style={styles.formCard}>
            <Text style={styles.formLabel}>Invite an employee</Text>
            <TextInput style={styles.input} placeholder="Employee email" placeholderTextColor={Brand.muted} autoCapitalize="none" keyboardType="email-address" value={inviteEmail} onChangeText={setInviteEmail} />
            <TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Name (optional)" placeholderTextColor={Brand.muted} value={inviteName} onChangeText={setInviteName} />
            {error && <Text style={styles.error}>{error}</Text>}
            {okMsg && <Text style={styles.ok}>{okMsg}</Text>}
            <Pressable style={styles.inviteBtn} onPress={sendInvite} disabled={busy}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.inviteBtnText}>{busy ? 'Sending…' : 'Send invite'}</Text>
            </Pressable>
          </Card>

          <View style={{ marginTop: 16, gap: 10 }}>
            <Card style={styles.row}>
              <View style={styles.avatar}><Ionicons name="star" size={18} color={Brand.red} /></View>
              <View style={styles.grow}>
                <Text style={styles.rowName}>You</Text>
                <Text style={styles.rowSub}>Owner</Text>
              </View>
              <View style={[styles.badge, styles.badgeOwner]}><Text style={styles.badgeOwnerText}>Owner</Text></View>
            </Card>

            {team.map((m) => (
              <Card key={m.id} style={styles.row}>
                <View style={styles.avatar}><Ionicons name="person" size={18} color={Brand.body} /></View>
                <View style={styles.grow}>
                  <Text style={styles.rowName}>{m.name}</Text>
                  <Text style={styles.rowSub}>{m.email}</Text>
                </View>
                <View style={[styles.badge, m.status === 'invited' && styles.badgeInvited]}>
                  <Text style={[styles.badgeText, m.status === 'invited' && styles.badgeInvitedText]}>{m.status === 'invited' ? 'Invited' : 'Employee'}</Text>
                </View>
                <Pressable onPress={() => remove(m.id)} hitSlop={8} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle" size={20} color={Brand.muted} />
                </Pressable>
              </Card>
            ))}
            {team.length === 0 && <Text style={styles.empty}>No employees yet. Invite someone above — they join by signing up with the invited email.</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  grow: { flex: 1 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  rowSub: { fontSize: 12, color: Brand.muted, marginTop: 2 },

  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10 },
  acceptBtn: { backgroundColor: Brand.green, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  leaveText: { color: Brand.red, fontWeight: '700', fontSize: 13 },
  msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.line, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  msgBtnText: { color: Brand.red, fontWeight: '700', fontSize: 12 },

  formCard: { padding: 16 },
  formLabel: { fontSize: 14, fontWeight: '700', color: Brand.ink, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Brand.ink },
  error: { color: Brand.red, fontWeight: '600', marginTop: 10, fontSize: 13 },
  ok: { color: Brand.green, fontWeight: '600', marginTop: 10, fontSize: 13 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.red, borderRadius: 12, paddingVertical: 14, marginTop: 14 },
  inviteBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Brand.surfaceAlt },
  badgeText: { fontSize: 11, fontWeight: '700', color: Brand.body },
  badgeOwner: { backgroundColor: Brand.redSoft },
  badgeOwnerText: { fontSize: 11, fontWeight: '700', color: Brand.red },
  badgeInvited: { backgroundColor: '#FDF1E6' },
  badgeInvitedText: { color: '#E8852B' },

  empty: { color: Brand.muted, fontSize: 13, lineHeight: 19, paddingVertical: 8 },
});
