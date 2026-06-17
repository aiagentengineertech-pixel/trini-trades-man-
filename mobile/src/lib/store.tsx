// App data store.
// Jobs & bids are LIVE from Supabase. Pros, chat and notifications are still
// curated/mock data (migrated in later stages).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import { TRADES } from '@/constants/trades';
import { formatDistance, haversineKm } from './locations';
import {
  acceptBidRpc,
  addTrade as addTradeDb,
  completeJobRpc,
  fetchBids,
  fetchFeatureGates,
  fetchNotifications,
  fetchConversations,
  fetchJobs,
  fetchProfile,
  fetchPros,
  fetchTrades,
  getOrCreateConversation,
  insertBid,
  insertJob,
  saveTradesmanProfile,
  updateProfile,
} from './db';
import {
  tradeStyle,
  TRADE_STYLE,
  type Bid,
  type Conversation,
  type IconName,
  type Job,
  type Message,
  type MyProfile,
  type Notification,
  type Pro,
} from './store-types';

export type { Bid, Conversation, IconName, Job, Message, MyProfile, Notification, Pro, Review } from './store-types';
export { tradeStyle } from './store-types';


interface StoreState {
  pros: Pro[];
  jobs: Job[];
  bids: Bid[];
  conversations: Conversation[];
  notifications: Notification[];
  myProfile: MyProfile | null;
  updateMyProfile: (fields: Partial<{ full_name: string; phone: string; area: string; photo_url: string; banner_url: string; role: string; location_lat: number; location_lng: number }>) => Promise<void>;
  trades: string[];
  addTrade: (name: string) => Promise<string | null>;
  setupTradesman: (trades: string[], bio: string, yearsExperience?: number | null) => Promise<void>;
  getPro: (id: string) => Pro | undefined;
  getJob: (id: string) => Job | undefined;
  bidsForJob: (jobId: string) => Bid[];
  myJobs: () => Job[];
  openJobs: () => Job[];
  myBids: () => Bid[];
  myBidForJob: (jobId: string) => Bid | undefined;
  addJob: (data: { title: string; trade: string; description: string; budgetMin?: number; budgetMax?: number; area?: string; invitedProId?: string | null; lat?: number | null; lng?: number | null }) => Promise<string | null>;
  distanceKm: (lat: number | null, lng: number | null) => number | null;
  distanceLabel: (lat: number | null, lng: number | null) => string | null;
  featureEnabled: (key: string) => boolean;
  acceptBid: (bidId: string) => Promise<void>;
  completeJob: (jobId: string) => Promise<void>;
  submitBid: (jobId: string, amount: number, message: string) => Promise<void>;
  myQuotes: () => { bid: Bid; job: Job | undefined }[];
  proSummary: () => ProSummary;
  refresh: () => Promise<void>;
  getConversation: (id: string) => Conversation | undefined;
  startConversation: (customerId: string, tradesmanId: string, jobId: string | null) => Promise<string | null>;
}

export interface ProSummary {
  quotesSent: number;
  pending: number;
  won: number;
  lost: number;
  activeJobs: number;
  completedJobs: number;
  escrowHeld: number;
  released: number;
  balance: number;
  totalEarned: number;
  avgJobValue: number;
  conversion: number; // 0..100
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [pros, setPros] = useState<Pro[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [nameToId, setNameToId] = useState<Record<string, string>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [gates, setGates] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const nti = await fetchTrades();
    setNameToId(nti);
    const idToName: Record<string, string> = {};
    Object.entries(nti).forEach(([name, id]) => (idToName[id] = name));
    const [j, b, c, pr] = await Promise.all([
      fetchJobs(userId, idToName),
      fetchBids(userId),
      userId ? fetchConversations(userId) : Promise.resolve([] as Conversation[]),
      fetchPros(),
    ]);
    setJobs(j);
    setBids(b);
    setConversations(c);
    setPros(pr);
    if (userId) {
      setMyProfile(await fetchProfile(userId));
      setNotifications(await fetchNotifications(userId));
      setGates(await fetchFeatureGates());
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load();
    else {
      setJobs([]);
      setBids([]);
      setConversations([]);
      setMyProfile(null);
      setNotifications([]);
    }
  }, [userId, load]);

  const value = useMemo<StoreState>(() => ({
    pros,
    jobs,
    bids,
    conversations,
    notifications,
    myProfile,
    updateMyProfile: async (fields) => {
      if (!userId) return;
      await updateProfile(userId, fields);
      setMyProfile((prev) => (prev ? {
        ...prev,
        fullName: fields.full_name ?? prev.fullName,
        phone: fields.phone ?? prev.phone,
        area: fields.area ?? prev.area,
        photoUrl: fields.photo_url ?? prev.photoUrl,
        bannerUrl: fields.banner_url ?? prev.bannerUrl,
        role: fields.role ?? prev.role,
        lat: fields.location_lat ?? prev.lat,
        lng: fields.location_lng ?? prev.lng,
      } : prev));
    },
    // Trade catalog: canonical trades first (in their defined order), then any
    // custom trades added by tradesmen, alphabetically.
    trades: (() => {
      const all = Object.keys(nameToId);
      const canonical = TRADES.filter((t) => all.includes(t));
      const extra = all.filter((t) => !TRADES.includes(t)).sort((a, b) => a.localeCompare(b));
      return [...canonical, ...extra];
    })(),
    addTrade: async (name) => {
      const created = await addTradeDb(name);
      if (created) await load(); // refresh nameToId so the new trade is selectable
      return created;
    },
    setupTradesman: async (trades, bio, yearsExperience) => {
      if (!userId) return;
      await saveTradesmanProfile(userId, trades, bio, nameToId, yearsExperience);
      await load();
    },
    getPro: (id) => pros.find((p) => p.id === id),
    getJob: (id) => jobs.find((j) => j.id === id),
    bidsForJob: (jobId) => bids.filter((b) => b.jobId === jobId),
    myJobs: () => jobs.filter((j) => j.mine),
    openJobs: () => jobs.filter((j) => j.status === 'open' && !j.mine),
    myBids: () => bids.filter((b) => b.mine),
    myBidForJob: (jobId) => bids.find((b) => b.jobId === jobId && b.mine),

    distanceKm: (lat, lng) => {
      if (lat == null || lng == null || myProfile?.lat == null || myProfile?.lng == null) return null;
      return haversineKm({ lat: myProfile.lat, lng: myProfile.lng }, { lat, lng });
    },
    distanceLabel: (lat, lng) => {
      if (lat == null || lng == null || myProfile?.lat == null || myProfile?.lng == null) return null;
      return formatDistance(haversineKm({ lat: myProfile.lat, lng: myProfile.lng }, { lat, lng }));
    },
    featureEnabled: (key) => gates[key] !== false, // default ON unless explicitly disabled

    addJob: async (data) => {
      if (!userId) return null;
      const id = await insertJob(userId, nameToId, data);
      await load();
      return id;
    },
    submitBid: async (jobId, amount, message) => {
      if (!userId) return;
      await insertBid(userId, jobId, amount, message);
      await load();
    },
    acceptBid: async (bidId) => {
      await acceptBidRpc(bidId);
      await load();
    },
    completeJob: async (jobId) => {
      await completeJobRpc(jobId);
      await load();
    },
    myQuotes: () => bids.filter((b) => b.mine).map((b) => ({ bid: b, job: jobs.find((j) => j.id === b.jobId) })),
    proSummary: () => {
      const mine = bids.filter((b) => b.mine).map((b) => ({ b, job: jobs.find((j) => j.id === b.jobId) }));
      const accepted = mine.filter((x) => x.b.status === 'accepted');
      const active = accepted.filter((x) => x.job?.status === 'hired');
      const done = accepted.filter((x) => x.job?.status === 'done');
      const escrowHeld = active.reduce((s, x) => s + x.b.amount, 0);
      const released = done.reduce((s, x) => s + x.b.amount, 0);
      const totalEarned = escrowHeld + released;
      const wonCount = accepted.length;
      const quotesSent = mine.length;
      return {
        quotesSent,
        pending: mine.filter((x) => x.b.status === 'pending').length,
        won: wonCount,
        lost: mine.filter((x) => x.b.status === 'rejected').length,
        activeJobs: active.length,
        completedJobs: done.length,
        escrowHeld,
        released,
        balance: released,
        totalEarned,
        avgJobValue: wonCount > 0 ? Math.round(totalEarned / wonCount) : 0,
        conversion: quotesSent > 0 ? Math.round((wonCount / quotesSent) * 100) : 0,
      };
    },
    refresh: load,

    getConversation: (id) => conversations.find((c) => c.id === id),
    startConversation: async (customerId, tradesmanId, jobId) => {
      const id = await getOrCreateConversation(customerId, tradesmanId, jobId);
      await load();
      return id;
    },
  }), [pros, jobs, bids, conversations, notifications, myProfile, gates, nameToId, userId, load]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
