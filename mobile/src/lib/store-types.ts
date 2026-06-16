// Shared types + helpers for the data layer (imported by both store.tsx and db.ts).
import { Ionicons } from '@expo/vector-icons';

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
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  yearsExperience: number | null;
  bio: string;
  services: string[];
  reviews: Review[];
}

export interface ProStats {
  yearsExperience: number | null;
  serviceRadiusKm: number | null;
  memberSince: number | null;
  jobsDone: number;
  hiredCount: number;
  completionRate: number | null;
  responseRate: number | null;
  avgResponseMins: number | null;
  repeatRate: number | null;
}

export interface PortfolioItem {
  id: string;
  title: string;
  value: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  date: string;
}

export interface InvoiceSettings {
  businessName: string;
  logoUrl: string | null;
  brandColor: string;
  taxId: string;
  paymentTerms: string;
  footerNote: string;
  contactPhone: string;
  contactEmail: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  kind: 'service' | 'material';
  unit: string;
  price: number;
}

export type DocType = 'invoice' | 'bill' | 'estimate' | 'quote';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  lat: number | null;
  lng: number | null;
  notes: string;
}

export interface ClientPhoto {
  id: string;
  url: string;
  caption: string;
  date: string;
}

export interface Expense {
  id: string;
  clientId: string | null;
  vendor: string;
  category: string;
  amount: number;
  note: string;
  receiptUrl: string | null;
  spentOn: string;
}

export type TeamRole = 'owner' | 'employee';

export interface TeamMember {
  id: string;
  ownerId: string;
  memberId: string | null;
  email: string;
  name: string;
  role: TeamRole;
  status: 'invited' | 'active' | 'removed';
  businessName?: string; // populated for invites/memberships
}

export interface PayoutAccount {
  method: 'bank' | 'wipay';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  wipayNumber: string;
}

export interface MyProfile {
  fullName: string;
  phone: string;
  area: string;
  photoUrl: string | null;
  role: string;
  verified: boolean;
  isPremium: boolean;
  lat: number | null;
  lng: number | null;
}

export type JobStatus = 'open' | 'hired' | 'done';

export interface Job {
  id: string;
  customerId: string;
  title: string;
  trade: string;
  description: string;
  area: string;
  budgetMin?: number;
  budgetMax?: number;
  status: JobStatus;
  mine: boolean;
  invitedProId: string | null;
  lat: number | null;
  lng: number | null;
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
  mine: boolean;
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

export { TRADE_STYLE };
