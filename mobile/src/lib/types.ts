// App-wide TypeScript types mirroring the Supabase schema (supabase/schema.sql).
// Keep these in sync with the database as it evolves.

export type UserRole = 'customer' | 'tradesman' | 'both';
export type JobStatus = 'open' | 'hired' | 'in_progress' | 'done' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type EscrowStatus = 'held' | 'released' | 'refunded';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  photo_url: string | null;
  role: UserRole;
  location_lat: number | null;
  location_lng: number | null;
  area: string | null;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface Trade {
  id: string;
  name: string;
  icon: string | null;
}

export interface Job {
  id: string;
  customer_id: string;
  trade_id: string | null;
  title: string;
  description: string | null;
  photos: string[];
  location_lat: number | null;
  location_lng: number | null;
  area: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: JobStatus;
  created_at: string;
}

export interface Bid {
  id: string;
  job_id: string;
  tradesman_id: string;
  amount: number;
  message: string | null;
  status: BidStatus;
  created_at: string;
}
