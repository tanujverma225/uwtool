import type { BidStatus, JobResponse, UserRole } from "@/db/schema";

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceRow {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface BidRow {
  id: string;
  job_title: string;
  url: string;
  upwork_job_id: string;
  similar_bid_id: string | null;
  proposal: string | null;
  questions: string | null;
  summary: string | null;
  country: string | null;
  status: BidStatus;
  job_response: JobResponse | null;
  shortlisted: boolean;
  client_viewed: boolean;
  client_responded: boolean;
  is_private_listing: boolean;
  connects_used: number | null;
  proposal_count_range: string | null;
  meghna_remarks: string | null;
  bidder_id: string;
  source_id: string | null;
  date_est: string | null;
  time_est: string | null;
  week_number: string | null;
  job_posted_at: string | null;
  bid_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BidWithRelations extends BidRow {
  profiles: Pick<ProfileRow, "id" | "full_name" | "email" | "avatar_url"> | null;
  sources: Pick<SourceRow, "id" | "name" | "color"> | null;
  similar_bid: Pick<BidRow, "id" | "job_title" | "url" | "bidder_id"> | null;
}

export interface TeamStatsRow {
  personId: string;
  personName: string;
  submitted: number;
  response: number;
  responsePct: number;
  view: number;
  viewPct: number;
  hired: number;
  hiredPct: number;
  connects: number;
}

export interface WeeklyViewRow {
  weekNumber: string;
  personId: string;
  personName: string;
  views: number;
}

export interface CreateBidInput {
  url: string;
  jobTitle?: string;
  sourceId?: string;
  summary?: string;
  questions?: string;
}

export interface UpdateBidInput {
  jobTitle?: string;
  proposal?: string;
  status?: BidStatus;
  jobResponse?: JobResponse;
  shortlisted?: boolean;
  clientViewed?: boolean;
  clientResponded?: boolean;
  connectsUsed?: number;
  country?: string;
  proposalCountRange?: string;
  meghnaRemarks?: string;
  sourceId?: string | null;
  questions?: string;
  summary?: string;
  bidSubmittedAt?: string;
}
