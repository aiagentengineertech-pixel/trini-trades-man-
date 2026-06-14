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
  bio: string;
  services: string[];
  reviews: Review[];
}

export interface MyProfile {
  fullName: string;
  phone: string;
  area: string;
  photoUrl: string | null;
  role: string;
  verified: boolean;
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
