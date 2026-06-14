// In-memory data store for the prototype. Everything the app shows lives here.
// Later this gets swapped for Supabase queries behind the same hook API —
// screens won't need to change much.
import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface Review {
  author: string;
  stars: number;
  text: string;
  date: string;
}

export interface Pro {
  id: string;
  name: string;
  trade: string;
  rating: number;
  reviewsCount: number;
  jobsDone: number;
  area: string;
  distance: string;
  verified: boolean;
  icon: IconName;
  color: string;
  bg: string;
  bio: string;
  services: string[];
  reviews: Review[];
}

export type JobStatus = 'open' | 'hired' | 'done';

export interface Job {
  id: string;
  title: string;
  trade: string;
  description: string;
  area: string;
  budgetMin?: number;
  budgetMax?: number;
  status: JobStatus;
  mine: boolean; // posted by the current user (customer view)
  createdAt: string;
  icon: IconName;
  color: string;
  bg: string;
}

export interface Bid {
  id: string;
  jobId: string;
  proId: string;
  proName: string;
  proRating: number;
  proIcon: IconName;
  proColor: string;
  proBg: string;
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  mine: boolean; // submitted by the current user (tradesman view)
}

export interface Message {
  id: string;
  conversationId: string;
  fromMe: boolean;
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  trade: string;
  icon: IconName;
  color: string;
  bg: string;
  jobTitle: string;
  lastMessage: string;
  unread: number;
}

export interface Notification {
  id: string;
  icon: IconName;
  color: string;
  bg: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const TRADE_STYLE: Record<string, { icon: IconName; color: string; bg: string }> = {
  Electrician: { icon: 'flash', color: '#E11D26', bg: '#FDECEC' },
  Plumbing: { icon: 'water', color: '#2F6FED', bg: '#EAF1FE' },
  'AC Repair': { icon: 'snow', color: '#16B1C9', bg: '#E6F8FB' },
  Carpentry: { icon: 'hammer', color: '#E8852B', bg: '#FDF1E6' },
  Painting: { icon: 'color-fill', color: '#2EA84F', bg: '#E9F8EE' },
  Masonry: { icon: 'cube', color: '#8B5CF6', bg: '#F1ECFE' },
};

export function tradeStyle(trade: string) {
  return TRADE_STYLE[trade] ?? { icon: 'briefcase' as IconName, color: '#7A8089', bg: '#F0F0F3' };
}

const PROS: Pro[] = [
  {
    id: 'p1', name: "John's Electrical", trade: 'Electrician', rating: 4.9, reviewsCount: 132, jobsDone: 132,
    area: 'Port of Spain', distance: '1.2 km away', verified: true, ...TRADE_STYLE.Electrician,
    bio: 'Licensed electrician with 12 years of experience. Residential and commercial wiring, panel upgrades, and emergency repairs across Trinidad.',
    services: ['Wiring & rewiring', 'Panel upgrades', 'Lighting installation', 'Emergency repairs'],
    reviews: [
      { author: 'Marcus R.', stars: 5, text: 'Fast and professional. Fixed my breaker same day.', date: '2 weeks ago' },
      { author: 'Aaliyah K.', stars: 5, text: 'Great work installing my ceiling fans. Fair price.', date: '1 month ago' },
    ],
  },
  {
    id: 'p2', name: 'Flow Right Plumbing', trade: 'Plumbing', rating: 4.8, reviewsCount: 98, jobsDone: 98,
    area: 'San Juan', distance: '1.5 km away', verified: true, ...TRADE_STYLE.Plumbing,
    bio: 'Your trusted plumbing team. Leak detection, water heaters, bathroom fittings and full installations. No job too small.',
    services: ['Leak repair', 'Water heater install', 'Bathroom fittings', 'Drain cleaning'],
    reviews: [
      { author: 'Devon P.', stars: 5, text: 'Sorted a nasty leak under the sink quickly.', date: '5 days ago' },
      { author: 'Nadia S.', stars: 4, text: 'Good job, arrived a little late but quality work.', date: '3 weeks ago' },
    ],
  },
  {
    id: 'p3', name: 'Cool Breeze AC', trade: 'AC Repair', rating: 4.9, reviewsCount: 76, jobsDone: 76,
    area: 'Chaguanas', distance: '2.1 km away', verified: true, ...TRADE_STYLE['AC Repair'],
    bio: 'AC specialists — servicing, gas top-up, installation and repairs for split and window units.',
    services: ['AC servicing', 'Gas refill', 'New install', 'Repairs'],
    reviews: [
      { author: 'Keron J.', stars: 5, text: 'My unit is like new again. Cold cold!', date: '1 week ago' },
    ],
  },
  {
    id: 'p4', name: 'BuildRight Carpentry', trade: 'Carpentry', rating: 4.7, reviewsCount: 64, jobsDone: 64,
    area: 'Arima', distance: '2.3 km away', verified: true, ...TRADE_STYLE.Carpentry,
    bio: 'Custom carpentry, cabinets, doors and furniture repair. Quality craftsmanship guaranteed.',
    services: ['Custom cabinets', 'Door fitting', 'Furniture repair', 'Decking'],
    reviews: [
      { author: 'Simone L.', stars: 5, text: 'Built me beautiful kitchen cabinets.', date: '2 months ago' },
    ],
  },
  {
    id: 'p5', name: 'Fresh Coat Painting', trade: 'Painting', rating: 4.6, reviewsCount: 51, jobsDone: 51,
    area: 'Diego Martin', distance: '3.0 km away', verified: false, ...TRADE_STYLE.Painting,
    bio: 'Interior and exterior painting done clean and on time. Free colour consultation.',
    services: ['Interior painting', 'Exterior painting', 'Waterproofing'],
    reviews: [
      { author: 'Hassan M.', stars: 5, text: 'House looks brand new. Tidy workers.', date: '3 weeks ago' },
    ],
  },
  {
    id: 'p6', name: 'Solid Block Masonry', trade: 'Masonry', rating: 4.8, reviewsCount: 43, jobsDone: 43,
    area: 'Couva', distance: '4.2 km away', verified: true, ...TRADE_STYLE.Masonry,
    bio: 'Blockwork, plastering, tiling and concrete. Reliable masons for any build.',
    services: ['Blockwork', 'Plastering', 'Tiling', 'Concrete'],
    reviews: [
      { author: 'Raj B.', stars: 5, text: 'Built my boundary wall solid and straight.', date: '1 month ago' },
    ],
  },
];

// Open jobs (used by the tradesman view to bid on).
const SEED_JOBS: Job[] = [
  { id: 'j1', title: 'Install 3 ceiling fans', trade: 'Electrician', description: 'Need 3 ceiling fans installed in bedrooms. Fans already purchased.', area: 'Maraval', budgetMin: 600, budgetMax: 1000, status: 'open', mine: false, createdAt: '2h ago', ...TRADE_STYLE.Electrician },
  { id: 'j2', title: 'Fix leaking kitchen tap', trade: 'Plumbing', description: 'Kitchen tap dripping constantly, possibly needs new cartridge.', area: 'St. Augustine', budgetMin: 200, budgetMax: 400, status: 'open', mine: false, createdAt: '5h ago', ...TRADE_STYLE.Plumbing },
  { id: 'j3', title: 'Service split AC unit', trade: 'AC Repair', description: 'Annual service for one split unit, not cooling well.', area: 'Westmoorings', budgetMin: 300, budgetMax: 500, status: 'open', mine: false, createdAt: '1d ago', ...TRADE_STYLE['AC Repair'] },
  { id: 'j4', title: 'Build small garden wall', trade: 'Masonry', description: 'Approx 10ft x 4ft boundary wall, blocks and plaster.', area: 'Couva', budgetMin: 2500, budgetMax: 4000, status: 'open', mine: false, createdAt: '1d ago', ...TRADE_STYLE.Masonry },
];

const SEED_BIDS: Bid[] = [];

const SEED_CONVERSATIONS: Conversation[] = [
  { id: 'c1', name: "John's Electrical", trade: 'Electrician', ...TRADE_STYLE.Electrician, jobTitle: 'Install 3 ceiling fans', lastMessage: 'I can come by Thursday morning 👍', unread: 1 },
  { id: 'c2', name: 'Flow Right Plumbing', trade: 'Plumbing', ...TRADE_STYLE.Plumbing, jobTitle: 'Fix leaking kitchen tap', lastMessage: 'Sounds good, see you then.', unread: 0 },
];

const SEED_MESSAGES: Message[] = [
  { id: 'm1', conversationId: 'c1', fromMe: true, text: 'Hi, are you available this week to install some fans?', time: '9:02 AM' },
  { id: 'm2', conversationId: 'c1', fromMe: false, text: 'Yes! How many fans and what area?', time: '9:10 AM' },
  { id: 'm3', conversationId: 'c1', fromMe: true, text: '3 fans, in Maraval. They’re already bought.', time: '9:12 AM' },
  { id: 'm4', conversationId: 'c1', fromMe: false, text: 'I can come by Thursday morning 👍', time: '9:15 AM' },
  { id: 'm5', conversationId: 'c2', fromMe: false, text: 'Sounds good, see you then.', time: 'Yesterday' },
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', icon: 'pricetag', color: '#2EA84F', bg: '#E9F8EE', title: 'New quote received', body: "John's Electrical sent a quote on your ceiling fan job.", time: '10m ago', unread: true },
  { id: 'n2', icon: 'chatbubble-ellipses', color: '#2F6FED', bg: '#EAF1FE', title: 'New message', body: 'Flow Right Plumbing replied to your enquiry.', time: '1h ago', unread: true },
  { id: 'n3', icon: 'checkmark-circle', color: '#E11D26', bg: '#FDECEC', title: 'Job confirmed', body: 'Your AC service has been scheduled for Thursday.', time: 'Yesterday', unread: false },
];

let idCounter = 100;
const nextId = (prefix: string) => `${prefix}${idCounter++}`;

interface StoreState {
  pros: Pro[];
  jobs: Job[];
  bids: Bid[];
  conversations: Conversation[];
  notifications: Notification[];
  getPro: (id: string) => Pro | undefined;
  getJob: (id: string) => Job | undefined;
  bidsForJob: (jobId: string) => Bid[];
  myJobs: () => Job[];
  openJobs: () => Job[];
  myBids: () => Bid[];
  myBidForJob: (jobId: string) => Bid | undefined;
  addJob: (data: { title: string; trade: string; description: string; budgetMin?: number; budgetMax?: number; area?: string }) => string;
  acceptBid: (bidId: string) => void;
  submitBid: (jobId: string, amount: number, message: string) => void;
  messagesFor: (conversationId: string) => Message[];
  sendMessage: (conversationId: string, text: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  startConversation: (proId: string, initialText?: string) => string;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [pros] = useState<Pro[]>(PROS);
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);
  const [bids, setBids] = useState<Bid[]>(SEED_BIDS);
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [notifications] = useState<Notification[]>(SEED_NOTIFICATIONS);

  const value = useMemo<StoreState>(() => ({
    pros,
    jobs,
    bids,
    conversations,
    notifications,
    getPro: (id) => pros.find((p) => p.id === id),
    getJob: (id) => jobs.find((j) => j.id === id),
    bidsForJob: (jobId) => bids.filter((b) => b.jobId === jobId),
    myJobs: () => jobs.filter((j) => j.mine),
    openJobs: () => jobs.filter((j) => j.status === 'open' && !j.mine),
    myBids: () => bids.filter((b) => b.mine),
    myBidForJob: (jobId) => bids.find((b) => b.jobId === jobId && b.mine),

    addJob: (data) => {
      const style = tradeStyle(data.trade);
      const id = nextId('j');
      const job: Job = {
        id,
        title: data.title,
        trade: data.trade,
        description: data.description,
        area: data.area ?? 'Port of Spain',
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        status: 'open',
        mine: true,
        createdAt: 'Just now',
        ...style,
      };
      setJobs((prev) => [job, ...prev]);

      // Simulate a couple of pros sending quotes shortly after posting.
      const candidates = pros.filter((p) => p.trade === data.trade).slice(0, 2);
      const base = data.budgetMin ?? 500;
      const newBids: Bid[] = candidates.map((p, i) => ({
        id: nextId('b'),
        jobId: id,
        proId: p.id,
        proName: p.name,
        proRating: p.rating,
        proIcon: p.icon,
        proColor: p.color,
        proBg: p.bg,
        amount: base + i * 150 + 100,
        message: i === 0 ? 'I can start this week. Quality guaranteed.' : 'Available immediately, fair price.',
        status: 'pending',
        mine: false,
      }));
      if (newBids.length) setTimeout(() => setBids((prev) => [...newBids, ...prev]), 1200);
      return id;
    },

    acceptBid: (bidId) => {
      setBids((prev) => {
        const accepted = prev.find((b) => b.id === bidId);
        if (!accepted) return prev;
        return prev.map((b) => {
          if (b.id === bidId) return { ...b, status: 'accepted' as const };
          if (b.jobId === accepted.jobId) return { ...b, status: 'rejected' as const };
          return b;
        });
      });
      setJobs((prev) =>
        prev.map((j) => {
          const accepted = bids.find((b) => b.id === bidId);
          return accepted && j.id === accepted.jobId ? { ...j, status: 'hired' as const } : j;
        }),
      );
    },

    submitBid: (jobId, amount, message) => {
      const bid: Bid = {
        id: nextId('b'),
        jobId,
        proId: 'me',
        proName: 'You',
        proRating: 5.0,
        proIcon: 'person',
        proColor: '#E11D26',
        proBg: '#FDECEC',
        amount,
        message,
        status: 'pending',
        mine: true,
      };
      setBids((prev) => [bid, ...prev]);
    },

    messagesFor: (conversationId) => messages.filter((m) => m.conversationId === conversationId),
    getConversation: (id) => conversations.find((c) => c.id === id),

    startConversation: (proId, initialText) => {
      const pro = pros.find((p) => p.id === proId);
      const existing = conversations.find((c) => c.name === pro?.name);
      const convId = existing?.id ?? nextId('c');

      if (!existing && pro) {
        const conv: Conversation = {
          id: convId,
          name: pro.name,
          trade: pro.trade,
          icon: pro.icon,
          color: pro.color,
          bg: pro.bg,
          jobTitle: 'New enquiry',
          lastMessage: initialText ?? '',
          unread: 0,
        };
        setConversations((prev) => [conv, ...prev]);
      }
      if (initialText) {
        const msg: Message = { id: nextId('m'), conversationId: convId, fromMe: true, text: initialText, time: 'Now' };
        setMessages((prev) => [...prev, msg]);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, lastMessage: initialText } : c)),
        );
      }
      return convId;
    },
    sendMessage: (conversationId, text) => {
      const msg: Message = {
        id: nextId('m'),
        conversationId,
        fromMe: true,
        text,
        time: 'Now',
      };
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, lastMessage: text, unread: 0 } : c)),
      );
    },
  }), [pros, jobs, bids, conversations, messages, notifications]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
