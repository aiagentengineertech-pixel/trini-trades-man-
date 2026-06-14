// App data store.
// Jobs & bids are LIVE from Supabase. Pros, chat and notifications are still
// curated/mock data (migrated in later stages).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import {
  acceptBidRpc,
  fetchBids,
  fetchConversations,
  fetchJobs,
  fetchProfile,
  fetchTrades,
  getOrCreateConversation,
  insertBid,
  insertJob,
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

const PROS: Pro[] = [
  { id: 'p1', name: "John's Electrical", trade: 'Electrician', rating: 4.9, reviewsCount: 132, jobsDone: 132, area: 'Port of Spain', distance: '1.2 km away', verified: true, ...TRADE_STYLE.Electrician,
    bio: 'Licensed electrician with 12 years of experience. Residential and commercial wiring, panel upgrades, and emergency repairs across Trinidad.',
    services: ['Wiring & rewiring', 'Panel upgrades', 'Lighting installation', 'Emergency repairs'],
    reviews: [ { author: 'Marcus R.', stars: 5, text: 'Fast and professional. Fixed my breaker same day.', date: '2 weeks ago' }, { author: 'Aaliyah K.', stars: 5, text: 'Great work installing my ceiling fans. Fair price.', date: '1 month ago' } ] },
  { id: 'p2', name: 'Flow Right Plumbing', trade: 'Plumbing', rating: 4.8, reviewsCount: 98, jobsDone: 98, area: 'San Juan', distance: '1.5 km away', verified: true, ...TRADE_STYLE.Plumbing,
    bio: 'Your trusted plumbing team. Leak detection, water heaters, bathroom fittings and full installations. No job too small.',
    services: ['Leak repair', 'Water heater install', 'Bathroom fittings', 'Drain cleaning'],
    reviews: [ { author: 'Devon P.', stars: 5, text: 'Sorted a nasty leak under the sink quickly.', date: '5 days ago' }, { author: 'Nadia S.', stars: 4, text: 'Good job, arrived a little late but quality work.', date: '3 weeks ago' } ] },
  { id: 'p3', name: 'Cool Breeze AC', trade: 'AC Repair', rating: 4.9, reviewsCount: 76, jobsDone: 76, area: 'Chaguanas', distance: '2.1 km away', verified: true, ...TRADE_STYLE['AC Repair'],
    bio: 'AC specialists — servicing, gas top-up, installation and repairs for split and window units.',
    services: ['AC servicing', 'Gas refill', 'New install', 'Repairs'],
    reviews: [ { author: 'Keron J.', stars: 5, text: 'My unit is like new again. Cold cold!', date: '1 week ago' } ] },
  { id: 'p4', name: 'BuildRight Carpentry', trade: 'Carpentry', rating: 4.7, reviewsCount: 64, jobsDone: 64, area: 'Arima', distance: '2.3 km away', verified: true, ...TRADE_STYLE.Carpentry,
    bio: 'Custom carpentry, cabinets, doors and furniture repair. Quality craftsmanship guaranteed.',
    services: ['Custom cabinets', 'Door fitting', 'Furniture repair', 'Decking'],
    reviews: [ { author: 'Simone L.', stars: 5, text: 'Built me beautiful kitchen cabinets.', date: '2 months ago' } ] },
  { id: 'p5', name: 'Fresh Coat Painting', trade: 'Painting', rating: 4.6, reviewsCount: 51, jobsDone: 51, area: 'Diego Martin', distance: '3.0 km away', verified: false, ...TRADE_STYLE.Painting,
    bio: 'Interior and exterior painting done clean and on time. Free colour consultation.',
    services: ['Interior painting', 'Exterior painting', 'Waterproofing'],
    reviews: [ { author: 'Hassan M.', stars: 5, text: 'House looks brand new. Tidy workers.', date: '3 weeks ago' } ] },
  { id: 'p6', name: 'Solid Block Masonry', trade: 'Masonry', rating: 4.8, reviewsCount: 43, jobsDone: 43, area: 'Couva', distance: '4.2 km away', verified: true, ...TRADE_STYLE.Masonry,
    bio: 'Blockwork, plastering, tiling and concrete. Reliable masons for any build.',
    services: ['Blockwork', 'Plastering', 'Tiling', 'Concrete'],
    reviews: [ { author: 'Raj B.', stars: 5, text: 'Built my boundary wall solid and straight.', date: '1 month ago' } ] },
];

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
  updateMyProfile: (fields: Partial<{ full_name: string; phone: string; area: string; photo_url: string; role: string }>) => Promise<void>;
  getPro: (id: string) => Pro | undefined;
  getJob: (id: string) => Job | undefined;
  bidsForJob: (jobId: string) => Bid[];
  myJobs: () => Job[];
  openJobs: () => Job[];
  myBids: () => Bid[];
  myBidForJob: (jobId: string) => Bid | undefined;
  addJob: (data: { title: string; trade: string; description: string; budgetMin?: number; budgetMax?: number; area?: string }) => Promise<string | null>;
  acceptBid: (bidId: string) => Promise<void>;
  submitBid: (jobId: string, amount: number, message: string) => Promise<void>;
  refresh: () => Promise<void>;
  getConversation: (id: string) => Conversation | undefined;
  startConversation: (customerId: string, tradesmanId: string, jobId: string | null) => Promise<string | null>;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [pros] = useState<Pro[]>(PROS);
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
    const [j, b, c] = await Promise.all([
      fetchJobs(userId, idToName),
      fetchBids(userId),
      userId ? fetchConversations(userId) : Promise.resolve([] as Conversation[]),
    ]);
    setJobs(j);
    setBids(b);
    setConversations(c);
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
      } : prev));
    },
    getPro: (id) => pros.find((p) => p.id === id),
    getJob: (id) => jobs.find((j) => j.id === id),
    bidsForJob: (jobId) => bids.filter((b) => b.jobId === jobId),
    myJobs: () => jobs.filter((j) => j.mine),
    openJobs: () => jobs.filter((j) => j.status === 'open' && !j.mine),
    myBids: () => bids.filter((b) => b.mine),
    myBidForJob: (jobId) => bids.find((b) => b.jobId === jobId && b.mine),

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
