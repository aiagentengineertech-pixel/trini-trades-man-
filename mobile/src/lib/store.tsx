// App data store.
// Jobs & bids are LIVE from Supabase. Pros, chat and notifications are still
// curated/mock data (migrated in later stages).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import { formatDistance, haversineKm } from './locations';
import {
  acceptBidRpc,
  fetchBids,
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


const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', icon: 'pricetag', color: '#2EA84F', bg: '#E9F8EE', title: 'New quote received', body: "John's Electrical sent a quote on your ceiling fan job.", time: '10m ago', unread: true },
  { id: 'n2', icon: 'chatbubble-ellipses', color: '#2F6FED', bg: '#EAF1FE', title: 'New message', body: 'Flow Right Plumbing replied to your enquiry.', time: '1h ago', unread: true },
  { id: 'n3', icon: 'checkmark-circle', color: '#E11D26', bg: '#FDECEC', title: 'Job confirmed', body: 'Your AC service has been scheduled for Thursday.', time: 'Yesterday', unread: false },
];

interface StoreState {
  pros: Pro[];
  jobs: Job[];
  bids: Bid[];
  conversations: Conversation[];
  notifications: Notification[];
  myProfile: MyProfile | null;
  updateMyProfile: (fields: Partial<{ full_name: string; phone: string; area: string; photo_url: string; role: string; location_lat: number; location_lng: number }>) => Promise<void>;
  setupTradesman: (trade: string, bio: string, yearsExperience?: number | null) => Promise<void>;
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
  acceptBid: (bidId: string) => Promise<void>;
  submitBid: (jobId: string, amount: number, message: string) => Promise<void>;
  refresh: () => Promise<void>;
  getConversation: (id: string) => Conversation | undefined;
  startConversation: (customerId: string, tradesmanId: string, jobId: string | null) => Promise<string | null>;
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
  const [notifications] = useState<Notification[]>(SEED_NOTIFICATIONS);

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
    if (userId) setMyProfile(await fetchProfile(userId));
  }, [userId]);

  useEffect(() => {
    if (userId) load();
    else {
      setJobs([]);
      setBids([]);
      setConversations([]);
      setMyProfile(null);
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
        role: fields.role ?? prev.role,
        lat: fields.location_lat ?? prev.lat,
        lng: fields.location_lng ?? prev.lng,
      } : prev));
    },
    setupTradesman: async (trade, bio, yearsExperience) => {
      if (!userId) return;
      await saveTradesmanProfile(userId, trade, bio, nameToId, yearsExperience);
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
    refresh: load,

    getConversation: (id) => conversations.find((c) => c.id === id),
    startConversation: async (customerId, tradesmanId, jobId) => {
      const id = await getOrCreateConversation(customerId, tradesmanId, jobId);
      await load();
      return id;
    },
  }), [pros, jobs, bids, conversations, notifications, myProfile, nameToId, userId, load]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
