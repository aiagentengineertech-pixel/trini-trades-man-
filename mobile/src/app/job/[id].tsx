import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { assignJob, fetchAssignment, fetchTeam, notifyUser, scheduleAssignment, unassignJob, type Assignment } from '@/lib/db';
import { useStore } from '@/lib/store';
import type { TeamMember } from '@/lib/store-types';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role, userId } = useAuth();
  const { getJob, bidsForJob, acceptBid, completeJob, submitBid, startConversation } = useStore();
  const job = getJob(id);
  const bids = bidsForJob(id);

  const messagePro = async (tradesmanId: string) => {
    if (!userId) return;
    const convId = await startConversation(userId, tradesmanId, id);
    if (convId) router.push({ pathname: '/chat/[id]', params: { id: convId } });
  };

  const viewPro = (tradesmanId: string) => router.push({ pathname: '/pro/[id]', params: { id: tradesmanId } });

  const messageCustomer = async () => {
    if (!userId || !job) return;
    const convId = await startConversation(job.customerId, userId, id);
    if (convId) router.push({ pathname: '/chat/[id]', params: { id: convId } });
  };

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [bidSent, setBidSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const myBid = bids.find((b) => b.mine);
  const isTradesmanRole = role === 'tradesman';
  const canAssign = isTradesmanRole && myBid?.status === 'accepted' && (job?.status === 'hired' || job?.status === 'done');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (canAssign && userId) {
      fetchTeam(userId).then((t) => setTeam(t.filter((m) => m.status === 'active' && m.memberId)));
      fetchAssignment(id).then(setAssignment);
    }
  }, [canAssign, userId, id]);

  const [schedDay, setSchedDay] = useState<number | null>(null); // days from today
  const [schedTime, setSchedTime] = useState<number | null>(null); // hour
  const [schedNote, setSchedNote] = useState('');
  const [dispatched, setDispatched] = useState(false);

  const assign = async (employeeId: string) => {
    if (!userId || !job) return;
    await assignJob(job.id, userId, employeeId);
    fetchAssignment(job.id).then(setAssignment);
  };
  const unassign = async () => {
    if (!job) return;
    await unassignJob(job.id);
    setAssignment(null);
    setDispatched(false);
  };

  const dispatch = async () => {
    if (!job || !assignment) return;
    let iso: string | null = null;
    let when = 'as soon as possible';
    if (schedDay != null && schedTime != null) {
      const d = new Date();
      d.setDate(d.getDate() + schedDay);
      d.setHours(schedTime, 0, 0, 0);
      iso = d.toISOString();
      when = d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
    await scheduleAssignment(job.id, iso, schedNote);
    await notifyUser(assignment.employeeId, 'dispatch', `Job assigned: ${job.title}`, `${when} · ${job.area}${schedNote ? ` · ${schedNote}` : ''}`, job.id);
    setDispatched(true);
    fetchAssignment(job.id).then(setAssignment);
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.flex}>
      <Ambient />
        <Text style={{ padding: 24 }}>Job not found.</Text>
      </SafeAreaView>
    );
  }

  const isTradesman = role === 'tradesman';
  const budget =
    job.budgetMin && job.budgetMax ? `TTD $${job.budgetMin} – $${job.budgetMax}` : 'Open to quotes';

  const onComplete = async () => {
    setCompleting(true);
    await completeJob(job!.id);
    setCompleting(false);
  };

  const sendBid = async () => {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError('Enter a valid quote amount.');
      return;
    }
    await submitBid(job.id, amt, message.trim() || 'I can do this job.');
    setBidSent(true);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <Ambient />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>Job Details</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {/* Job header */}
          <View style={styles.jobHead}>
            <View style={[styles.jobIcon, { backgroundColor: job.bg }]}>
              <Ionicons name={job.icon} size={28} color={job.color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobMeta}>{job.trade} · {job.area} · {job.createdAt}</Text>
            </View>
          </View>

          <View style={styles.budgetCard}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budgetValue}>{budget}</Text>
            <View style={[styles.statusPill, job.status !== 'open' && styles.statusPillHired]}>
              <Text style={[styles.statusText, job.status !== 'open' && { color: '#fff' }]}>
                {job.status === 'open' ? 'Open' : job.status === 'hired' ? 'Hired' : 'Done'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{job.description}</Text>
          </View>

          {/* CUSTOMER: confirm completion → release escrow */}
          {!isTradesman && job.mine && job.status === 'hired' && (
            <View style={styles.section}>
              <View style={styles.completeCard}>
                <Text style={styles.completeTitle}>Work finished?</Text>
                <Text style={styles.completeSub}>Confirm the job is done to release the escrow payment to your tradesman. Only do this once you're satisfied.</Text>
                <Pressable style={styles.completeBtn} onPress={onComplete} disabled={completing}>
                  <Ionicons name="checkmark-done" size={18} color="#fff" />
                  <Text style={styles.completeBtnText}>{completing ? 'Releasing…' : 'Mark complete & release payment'}</Text>
                </Pressable>
              </View>
            </View>
          )}
          {job.status === 'done' && (
            <View style={styles.section}>
              <View style={styles.doneCard}>
                <Ionicons name="checkmark-circle" size={22} color={Brand.green} />
                <Text style={styles.doneText}>This job is complete. Payment has been released from escrow.</Text>
              </View>
            </View>
          )}

          {/* TRADESMAN: submit a bid */}
          {isTradesman ? (
            <>
            {canAssign && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assign to a team member</Text>
                {assignment ? (
                  <>
                  <View style={styles.assignedRow}>
                    <Ionicons name="person-circle" size={22} color={Brand.green} />
                    <Text style={styles.assignedText}>{assignment.employeeName || 'Employee'} is on this job</Text>
                    <Pressable onPress={unassign} hitSlop={8}><Text style={styles.assignChange}>Change</Text></Pressable>
                  </View>
                  {assignment.scheduledAt && !dispatched && (
                    <Text style={styles.schedCurrent}>Scheduled: {new Date(assignment.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
                  )}
                  <Text style={styles.schedLabel}>Schedule (optional)</Text>
                  <View style={styles.chipRow}>
                    {[['Today', 0], ['Tomorrow', 1], ['+2 days', 2], ['+3 days', 3]].map(([lbl, d]) => (
                      <Pressable key={lbl as string} onPress={() => setSchedDay(d as number)} style={[styles.schedChip, schedDay === d && styles.schedChipOn]}>
                        <Text style={[styles.schedChipText, schedDay === d && styles.schedChipTextOn]}>{lbl as string}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.chipRow}>
                    {[['Morning', 8], ['Midday', 12], ['Afternoon', 15]].map(([lbl, h]) => (
                      <Pressable key={lbl as string} onPress={() => setSchedTime(h as number)} style={[styles.schedChip, schedTime === h && styles.schedChipOn]}>
                        <Text style={[styles.schedChipText, schedTime === h && styles.schedChipTextOn]}>{lbl as string}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput style={styles.schedNote} placeholder="Note for the employee (optional)" placeholderTextColor={Brand.muted} value={schedNote} onChangeText={setSchedNote} />
                  <Pressable style={styles.dispatchBtn} onPress={dispatch}>
                    <Ionicons name={dispatched ? 'checkmark-done' : 'send'} size={16} color="#fff" />
                    <Text style={styles.dispatchText}>{dispatched ? 'Dispatched ✓' : 'Dispatch & notify employee'}</Text>
                  </Pressable>
                  </>
                ) : team.length === 0 ? (
                  <Text style={styles.assignHint}>Invite employees on the Team screen, then assign this job to one of them.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {team.map((m) => (
                      <Pressable key={m.id} style={styles.assignPick} onPress={() => m.memberId && assign(m.memberId)}>
                        <View style={styles.assignAvatar}><Ionicons name="person" size={16} color={Brand.body} /></View>
                        <Text style={styles.assignName}>{m.name}</Text>
                        <Ionicons name="chevron-forward" size={18} color={Brand.muted} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your quote</Text>
              {bidSent || myBid ? (
                <>
                  <View style={styles.sentCard}>
                    <Ionicons name="checkmark-circle" size={22} color={Brand.green} />
                    <Text style={styles.sentText}>
                      {myBid?.status === 'accepted'
                        ? "Your quote was accepted — you're hired!"
                        : myBid?.status === 'rejected'
                          ? 'This job went to another tradesman.'
                          : `Quote submitted${myBid ? ` — TT$${myBid.amount.toLocaleString()}` : ''}. The customer will be notified.`}
                    </Text>
                  </View>
                  <Pressable style={styles.msgCustomerBtn} onPress={messageCustomer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={Brand.red} />
                    <Text style={styles.msgCustomerText}>Message the customer</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.amountField}>
                    <Text style={styles.currency}>TTD $</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      placeholderTextColor={Brand.muted}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <TextInput
                    style={styles.msgInput}
                    placeholder="Add a message (availability, what's included…)"
                    placeholderTextColor={Brand.muted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                  />
                  {error && <Text style={styles.error}>{error}</Text>}
                  <Pressable style={styles.primaryBtn} onPress={sendBid}>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Submit Quote</Text>
                  </Pressable>
                </>
              )}
            </View>
            </>
          ) : (
            /* CUSTOMER: view & accept bids */
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quotes received ({bids.length})</Text>
              {bids.length === 0 ? (
                <View style={styles.emptyBids}>
                  <Ionicons name="hourglass-outline" size={26} color={Brand.muted} />
                  <Text style={styles.emptyText}>Waiting for tradesmen to send quotes…</Text>
                </View>
              ) : (
                bids.map((b) => (
                  <View
                    key={b.id}
                    style={[styles.bidCard, b.status === 'accepted' && styles.bidAccepted, b.status === 'rejected' && styles.bidRejected]}>
                    <Pressable onPress={() => viewPro(b.proId)}>
                      <View style={[styles.bidAvatar, { backgroundColor: b.proBg }]}>
                        <Ionicons name={b.proIcon} size={20} color={b.proColor} />
                      </View>
                    </Pressable>
                    <View style={styles.flex}>
                      <View style={styles.bidTopRow}>
                        <Pressable onPress={() => viewPro(b.proId)}>
                          <Text style={[styles.bidName, styles.bidNameLink]}>{b.proName}</Text>
                        </Pressable>
                        <View style={styles.bidRating}>
                          <Ionicons name="star" size={12} color={Brand.star} />
                          <Text style={styles.bidRatingText}>{b.proRating.toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text style={styles.bidMsg}>{b.message}</Text>
                      <View style={styles.bidBottomRow}>
                        <Text style={styles.bidAmount}>TTD ${b.amount}</Text>
                        <Pressable style={styles.msgBtn} onPress={() => viewPro(b.proId)}>
                          <Ionicons name="person-circle-outline" size={15} color={Brand.red} />
                          <Text style={styles.msgBtnText}>Profile</Text>
                        </Pressable>
                        <Pressable style={styles.msgBtn} onPress={() => messagePro(b.proId)}>
                          <Ionicons name="chatbubble-ellipses-outline" size={15} color={Brand.red} />
                          <Text style={styles.msgBtnText}>Message</Text>
                        </Pressable>
                        {b.status === 'pending' && job.status === 'open' && (
                          <Pressable style={styles.acceptBtn} onPress={() => acceptBid(b.id)}>
                            <Text style={styles.acceptText}>Accept</Text>
                          </Pressable>
                        )}
                        {b.status === 'accepted' && (
                          <View style={styles.acceptedTag}>
                            <Ionicons name="checkmark-circle" size={14} color={Brand.green} />
                            <Text style={styles.acceptedTagText}>Accepted</Text>
                          </View>
                        )}
                        {b.status === 'rejected' && <Text style={styles.declinedText}>Declined</Text>}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  jobHead: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  jobIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  jobTitle: { fontSize: 20, fontWeight: '800', color: Brand.ink },
  jobMeta: { fontSize: 13, color: Brand.muted, marginTop: 4 },

  budgetCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Brand.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetLabel: { fontSize: 13, color: Brand.muted, marginRight: 10 },
  budgetValue: { fontSize: 16, fontWeight: '800', color: Brand.ink, flex: 1 },
  statusPill: { backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.line, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusPillHired: { backgroundColor: Brand.green, borderColor: Brand.green },
  statusText: { fontSize: 12, fontWeight: '700', color: Brand.body },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Brand.ink, marginBottom: 12 },
  body: { fontSize: 14, color: Brand.body, lineHeight: 21 },

  emptyBids: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyText: { fontSize: 14, color: Brand.muted },

  bidCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Brand.line, marginBottom: 12 },
  bidAccepted: { borderColor: Brand.green, backgroundColor: '#F1FBF5' },
  bidRejected: { opacity: 0.55 },
  bidAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  bidTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bidName: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  bidNameLink: { color: Brand.red, textDecorationLine: 'underline' },
  bidRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bidRatingText: { fontSize: 12, fontWeight: '700', color: Brand.ink },
  bidMsg: { fontSize: 13, color: Brand.body, marginTop: 4, lineHeight: 18 },
  bidBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  bidAmount: { fontSize: 17, fontWeight: '800', color: Brand.red },
  acceptBtn: { backgroundColor: Brand.red, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Brand.line, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  msgBtnText: { color: Brand.red, fontWeight: '700', fontSize: 12 },
  acceptedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  acceptedTagText: { color: Brand.green, fontWeight: '700', fontSize: 13 },
  declinedText: { color: Brand.muted, fontWeight: '600', fontSize: 13 },

  amountField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14 },
  currency: { fontSize: 16, fontWeight: '700', color: Brand.muted },
  amountInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: Brand.ink },
  msgInput: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, padding: 14, marginTop: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 15, color: Brand.ink },
  error: { color: Brand.red, fontWeight: '600', marginTop: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1FBF5', borderRadius: 12, padding: 14 },
  assignedText: { flex: 1, fontSize: 14, fontWeight: '700', color: Brand.ink },
  assignChange: { color: Brand.red, fontWeight: '700', fontSize: 13 },
  assignHint: { fontSize: 13, color: Brand.muted, lineHeight: 19 },
  assignPick: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Brand.line, borderRadius: 12, padding: 12 },
  assignAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  assignName: { flex: 1, fontSize: 15, fontWeight: '600', color: Brand.ink },
  schedCurrent: { fontSize: 13, color: Brand.green, fontWeight: '700', marginTop: 10 },
  schedLabel: { fontSize: 13, fontWeight: '700', color: Brand.ink, marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  schedChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Brand.line },
  schedChipOn: { backgroundColor: Brand.red, borderColor: Brand.red },
  schedChipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  schedChipTextOn: { color: '#fff' },
  schedNote: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Brand.ink, marginTop: 4 },
  dispatchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.ink, borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  dispatchText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  completeCard: { backgroundColor: '#F1FBF5', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#CDEBD8' },
  completeTitle: { fontSize: 16, fontWeight: '800', color: Brand.ink },
  completeSub: { fontSize: 13, color: Brand.body, lineHeight: 19, marginTop: 6 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.green, borderRadius: 12, paddingVertical: 14, marginTop: 14 },
  completeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1FBF5', borderRadius: 14, padding: 16 },
  doneText: { flex: 1, fontSize: 14, color: Brand.body, fontWeight: '600' },

  sentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1FBF5', borderRadius: 14, padding: 16 },
  sentText: { flex: 1, fontSize: 14, color: Brand.body, fontWeight: '600' },
  msgCustomerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Brand.red, borderRadius: 14, paddingVertical: 14, marginTop: 12 },
  msgCustomerText: { color: Brand.red, fontWeight: '700', fontSize: 15 },
});
