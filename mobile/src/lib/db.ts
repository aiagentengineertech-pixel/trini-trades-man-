// Supabase data access for jobs, bids & chat.
import { supabase } from './supabase';
import { tradeStyle, type Bid, type Conversation, type Job, type Message, type MyProfile } from './store-types';

function clockTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export async function fetchTrades(): Promise<Record<string, string>> {
  // returns name -> id
  const { data } = await supabase.from('trades').select('id,name');
  const map: Record<string, string> = {};
  (data ?? []).forEach((t: { id: string; name: string }) => (map[t.name] = t.id));
  return map;
}

export async function fetchJobs(userId: string | null, idToName: Record<string, string>): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, customer_id, trade_id, title, description, area, budget_min, budget_max, status, created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => {
    const trade = (r.trade_id && idToName[r.trade_id]) || 'Other';
    const style = tradeStyle(trade);
    return {
      id: r.id,
      customerId: r.customer_id,
      title: r.title,
      trade,
      description: r.description ?? '',
      area: r.area ?? 'Trinidad',
      budgetMin: r.budget_min ?? undefined,
      budgetMax: r.budget_max ?? undefined,
      status: r.status,
      mine: !!userId && r.customer_id === userId,
      createdAt: relativeTime(r.created_at),
      ...style,
    } as Job;
  });
}

export async function insertJob(
  userId: string,
  nameToId: Record<string, string>,
  data: { title: string; trade: string; description: string; budgetMin?: number; budgetMax?: number; area?: string },
): Promise<string | null> {
  const { data: row, error } = await supabase
    .from('jobs')
    .insert({
      customer_id: userId,
      trade_id: nameToId[data.trade] ?? null,
      title: data.title,
      description: data.description,
      area: data.area ?? 'Port of Spain',
      budget_min: data.budgetMin ?? null,
      budget_max: data.budgetMax ?? null,
      status: 'open',
    })
    .select('id')
    .single();
  if (error) {
    console.warn('[db] insertJob failed:', error.message);
    return null;
  }
  return row?.id ?? null;
}

export async function fetchBids(userId: string | null): Promise<Bid[]> {
  // RLS returns only bids on my jobs or bids I made.
  const { data, error } = await supabase
    .from('bids')
    .select('id, job_id, tradesman_id, amount, message, status, tradesman:profiles!tradesman_id(full_name, rating_avg)')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    jobId: r.job_id,
    proId: r.tradesman_id,
    proName: r.tradesman?.full_name ?? 'Tradesman',
    proRating: r.tradesman?.rating_avg ?? 5,
    proIcon: 'person',
    proColor: '#E11D26',
    proBg: '#FDECEC',
    amount: Number(r.amount),
    message: r.message ?? '',
    status: r.status,
    mine: !!userId && r.tradesman_id === userId,
  })) as Bid[];
}

export async function insertBid(userId: string, jobId: string, amount: number, message: string): Promise<boolean> {
  const { error } = await supabase.from('bids').insert({
    job_id: jobId,
    tradesman_id: userId,
    amount,
    message,
    status: 'pending',
  });
  if (error) {
    console.warn('[db] insertBid failed:', error.message);
    return false;
  }
  return true;
}

export async function acceptBidRpc(bidId: string): Promise<boolean> {
  const { error } = await supabase.rpc('accept_bid', { p_bid_id: bidId });
  if (error) {
    console.warn('[db] acceptBid failed:', error.message);
    return false;
  }
  return true;
}

// ---------------- Profile ----------------

export async function fetchProfile(userId: string): Promise<MyProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, phone, area, photo_url, role, verified')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    fullName: data.full_name ?? '',
    phone: data.phone ?? '',
    area: data.area ?? '',
    photoUrl: data.photo_url ?? null,
    role: data.role ?? 'customer',
    verified: !!data.verified,
  };
}

export async function updateProfile(
  userId: string,
  fields: Partial<{ full_name: string; phone: string; area: string; photo_url: string; role: string }>,
): Promise<boolean> {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) { console.warn('[db] updateProfile failed:', error.message); return false; }
  return true;
}

// ---------------- Pros (real tradesmen) ----------------

import type { PayoutAccount, PortfolioItem, Pro, Review } from './store-types';

export async function fetchPayoutAccount(userId: string): Promise<PayoutAccount | null> {
  const { data, error } = await supabase
    .from('payout_accounts')
    .select('method, bank_name, account_number, account_holder, wipay_number')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    method: (data.method as 'bank' | 'wipay') || 'bank',
    bankName: data.bank_name ?? '',
    accountNumber: data.account_number ?? '',
    accountHolder: data.account_holder ?? '',
    wipayNumber: data.wipay_number ?? '',
  };
}

export async function savePayoutAccount(userId: string, a: PayoutAccount): Promise<boolean> {
  const { error } = await supabase.from('payout_accounts').upsert({
    user_id: userId,
    method: a.method,
    bank_name: a.bankName || null,
    account_number: a.accountNumber || null,
    account_holder: a.accountHolder || null,
    wipay_number: a.wipayNumber || null,
    updated_at: new Date().toISOString(),
  });
  if (error) { console.warn('[db] savePayoutAccount failed:', error.message); return false; }
  return true;
}

export async function fetchPortfolio(proId: string): Promise<PortfolioItem[]> {
  const { data, error } = await supabase
    .from('portfolio')
    .select('id, title, value, before_url, after_url, created_at')
    .eq('tradesman_id', proId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    value: r.value ? `TT$${Number(r.value).toLocaleString()}` : '',
    beforeUrl: r.before_url,
    afterUrl: r.after_url,
    date: relativeTime(r.created_at),
  }));
}

export async function addPortfolioItem(
  tradesmanId: string,
  item: { title: string; value?: number; beforeUri?: string | null; afterUri?: string | null },
): Promise<boolean> {
  const stamp = Date.now();
  let beforeUrl: string | null = null;
  let afterUrl: string | null = null;
  if (item.beforeUri) beforeUrl = await uploadImage('uploads', `portfolio/${tradesmanId}/${stamp}-before.jpg`, item.beforeUri);
  if (item.afterUri) afterUrl = await uploadImage('uploads', `portfolio/${tradesmanId}/${stamp}-after.jpg`, item.afterUri);
  const { error } = await supabase.from('portfolio').insert({
    tradesman_id: tradesmanId,
    title: item.title,
    value: item.value ?? null,
    before_url: beforeUrl,
    after_url: afterUrl,
  });
  if (error) { console.warn('[db] addPortfolioItem failed:', error.message); return false; }
  return true;
}

export async function deletePortfolioItem(id: string): Promise<void> {
  await supabase.from('portfolio').delete().eq('id', id);
}

export async function fetchPros(): Promise<Pro[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, area, photo_url, verified, rating_avg, rating_count, tradesman_info(bio, years_experience), tradesman_trades(trades(name))')
    .in('role', ['tradesman', 'both']);
  if (error || !data) return [];
  return data.map((p: any) => {
    const info = Array.isArray(p.tradesman_info) ? p.tradesman_info[0] : p.tradesman_info;
    const tt = Array.isArray(p.tradesman_trades) ? p.tradesman_trades : [];
    const trade = tt[0]?.trades?.name || 'General';
    const style = tradeStyle(trade);
    return {
      id: p.id,
      name: p.full_name || 'Tradesman',
      trade,
      rating: Number(p.rating_avg) || 0,
      reviewsCount: p.rating_count || 0,
      jobsDone: p.rating_count || 0,
      area: p.area || 'Trinidad',
      distance: 'Nearby',
      verified: !!p.verified,
      photoUrl: p.photo_url ?? null,
      bio: info?.bio || 'Trusted local tradesman on Trini Tradesman.',
      services: tt.map((x: any) => x.trades?.name).filter(Boolean),
      reviews: [],
      ...style,
    } as Pro;
  });
}

export async function fetchProReviews(proId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('stars, comment, created_at, reviewer:profiles!reviewer_id(full_name)')
    .eq('reviewee_id', proId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    author: r.reviewer?.full_name || 'Customer',
    stars: r.stars,
    text: r.comment || '',
    date: relativeTime(r.created_at),
  }));
}

export async function saveTradesmanProfile(
  userId: string,
  trade: string,
  bio: string,
  nameToId: Record<string, string>,
): Promise<boolean> {
  const upd = await supabase.from('profiles').update({ role: 'tradesman' }).eq('id', userId);
  if (upd.error) { console.warn('[db] role update failed:', upd.error.message); }
  await supabase.from('tradesman_info').upsert({ user_id: userId, bio });
  const tradeId = nameToId[trade];
  if (tradeId) {
    await supabase.from('tradesman_trades').upsert({ user_id: userId, trade_id: tradeId });
  }
  return true;
}

// ---------------- Storage ----------------

export async function uploadImage(bucket: string, path: string, uri: string): Promise<string | null> {
  try {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg',
    });
    if (error) { console.warn('[db] upload failed:', error.message); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (e: any) {
    console.warn('[db] upload error:', e?.message);
    return null;
  }
}

// ---------------- Chat ----------------

export async function getOrCreateConversation(
  customerId: string,
  tradesmanId: string,
  jobId: string | null,
): Promise<string | null> {
  let q = supabase
    .from('conversations')
    .select('id')
    .eq('customer_id', customerId)
    .eq('tradesman_id', tradesmanId);
  q = jobId ? q.eq('job_id', jobId) : q.is('job_id', null);
  const { data: existing } = await q.maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ customer_id: customerId, tradesman_id: tradesmanId, job_id: jobId })
    .select('id')
    .single();
  if (error) {
    console.warn('[db] getOrCreateConversation failed:', error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function fetchConversations(meId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, customer_id, tradesman_id, last_message, job:jobs(title), customer:profiles!customer_id(full_name), tradesman:profiles!tradesman_id(full_name)')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map((c: any) => {
    const iAmCustomer = c.customer_id === meId;
    const other = iAmCustomer ? c.tradesman : c.customer;
    return {
      id: c.id,
      name: other?.full_name || 'User',
      trade: '',
      icon: 'person',
      color: '#E11D26',
      bg: '#FDECEC',
      jobTitle: c.job?.title || 'Enquiry',
      lastMessage: c.last_message || 'Say hello 👋',
      unread: 0,
    } as Conversation;
  });
}

export async function fetchMessages(conversationId: string, meId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, sent_at')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true });
  if (error || !data) return [];
  return data.map((m: any) => ({
    id: m.id,
    conversationId,
    fromMe: m.sender_id === meId,
    text: m.body,
    time: clockTime(m.sent_at),
  }));
}

export async function sendChatMessage(conversationId: string, senderId: string, body: string): Promise<void> {
  const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) { console.warn('[db] sendChatMessage failed:', error.message); return; }
  await supabase.from('conversations').update({ last_message: body, updated_at: new Date().toISOString() }).eq('id', conversationId);
}

export function subscribeToMessages(conversationId: string, meId: string, onNew: (m: Message) => void): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload: any) => {
        const m = payload.new;
        onNew({ id: m.id, conversationId, fromMe: m.sender_id === meId, text: m.body, time: clockTime(m.sent_at) });
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
