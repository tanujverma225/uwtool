"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseUpworkUrl } from "@/lib/upwork-url";
import {
  formatEstTime,
  getWeekNumberLabel,
  toEstDate,
} from "@/lib/dates";
import type { BidStatus, JobResponse } from "@/db/schema";
import type { CreateBidInput, UpdateBidInput } from "@/types/database";
import { BID_EXPORT_COLUMNS, rowsToCsv } from "@/lib/export-csv";
import { formatEstDate } from "@/lib/dates";
import { requireAdmin } from "@/lib/auth";

function getJoinedProfileName(
  profiles: { full_name: string } | { full_name: string }[] | null | undefined
): string {
  if (!profiles) return "Unknown";
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? "Unknown";
  return profiles.full_name;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function checkDuplicateBid(upworkJobId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bids")
    .select(
      "id, job_title, url, status, bidder_id, profiles(full_name), created_at"
    )
    .eq("upwork_job_id", upworkJobId)
    .not("status", "in", '("draft","canceled")')
    .is("similar_bid_id", null)
    .limit(1)
    .maybeSingle();

  return data;
}

export type DuplicateBidInfo = {
  id: string;
  jobTitle: string;
  url: string;
  status: string;
  bidderName: string;
  createdAt: string;
};

export async function checkDuplicateByUrl(url: string) {
  const parsed = parseUpworkUrl(url);
  if (!parsed.isValid || !parsed.upworkJobId) {
    return {
      valid: false as const,
      error: "Invalid Upwork job URL",
      duplicates: [] as DuplicateBidInfo[],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bids")
    .select(
      "id, job_title, url, status, created_at, profiles:bidder_id(full_name)"
    )
    .eq("upwork_job_id", parsed.upworkJobId)
    .neq("status", "canceled")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return {
      valid: true as const,
      upworkJobId: parsed.upworkJobId,
      normalizedUrl: parsed.normalizedUrl,
      duplicates: [] as DuplicateBidInfo[],
      error: error.message,
    };
  }

  const duplicates: DuplicateBidInfo[] = (data ?? []).map((row) => ({
    id: row.id,
    jobTitle: row.job_title,
    url: row.url,
    status: row.status,
    bidderName: getJoinedProfileName(
      row.profiles as
        | { full_name: string }
        | { full_name: string }[]
        | null
    ),
    createdAt: row.created_at,
  }));

  return {
    valid: true as const,
    upworkJobId: parsed.upworkJobId,
    normalizedUrl: parsed.normalizedUrl,
    duplicates,
    isDuplicate: duplicates.length > 0,
  };
}

export async function createBid(input: CreateBidInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const parsed = parseUpworkUrl(input.url);
  if (!parsed.isValid || !parsed.upworkJobId) {
    return { error: "Invalid Upwork job URL. Paste a valid Upwork job link." };
  }

  const duplicate = await checkDuplicateBid(parsed.upworkJobId);

  const now = new Date();
  const { data, error } = await supabase
    .from("bids")
    .insert({
      job_title: input.jobTitle || "Untitled Upwork Job",
      url: parsed.normalizedUrl,
      upwork_job_id: parsed.upworkJobId,
      similar_bid_id: duplicate?.id ?? null,
      bidder_id: user.id,
      source_id: input.sourceId ?? null,
      summary: input.summary ?? null,
      questions: input.questions ?? null,
      status: duplicate ? "draft" : "draft",
      date_est: toEstDate(now).toISOString(),
      time_est: formatEstTime(now),
      week_number: getWeekNumberLabel(now),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This job has already been submitted by your team." };
    }
    return { error: error.message };
  }

  revalidatePath("/bids");
  return {
    data,
    duplicate: duplicate
      ? {
          id: duplicate.id,
          jobTitle: duplicate.job_title,
          bidderName: getJoinedProfileName(
            duplicate.profiles as
              | { full_name: string }
              | { full_name: string }[]
              | null
          ),
        }
      : null,
  };
}

export async function updateBid(bidId: string, input: UpdateBidInput) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.jobTitle !== undefined) updates.job_title = input.jobTitle;
  if (input.proposal !== undefined) updates.proposal = input.proposal;
  if (input.status !== undefined) updates.status = input.status;
  if (input.jobResponse !== undefined) updates.job_response = input.jobResponse;
  if (input.shortlisted !== undefined) updates.shortlisted = input.shortlisted;
  if (input.clientViewed !== undefined) updates.client_viewed = input.clientViewed;
  if (input.clientResponded !== undefined)
    updates.client_responded = input.clientResponded;
  if (input.connectsUsed !== undefined) updates.connects_used = input.connectsUsed;
  if (input.country !== undefined) updates.country = input.country;
  if (input.proposalCountRange !== undefined)
    updates.proposal_count_range = input.proposalCountRange;
  if (input.meghnaRemarks !== undefined)
    updates.meghna_remarks = input.meghnaRemarks;
  if (input.sourceId !== undefined) updates.source_id = input.sourceId;
  if (input.questions !== undefined) updates.questions = input.questions;
  if (input.summary !== undefined) updates.summary = input.summary;

  if (input.status === "submitted" && !input.bidSubmittedAt) {
    const now = new Date();
    updates.bid_submitted_at = now.toISOString();
    updates.date_est = toEstDate(now).toISOString();
    updates.time_est = formatEstTime(now);
    updates.week_number = getWeekNumberLabel(now);
  }

  if (input.bidSubmittedAt) {
    updates.bid_submitted_at = input.bidSubmittedAt;
  }

  const { error } = await supabase.from("bids").update(updates).eq("id", bidId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bids");
  revalidatePath("/submitted");
  revalidatePath("/stats");
  revalidatePath(`/bids/${bidId}`);
  return { success: true };
}

export async function submitBid(bidId: string) {
  return updateBid(bidId, { status: "submitted" as BidStatus });
}

export async function markClientViewed(bidId: string, viewed: boolean) {
  const updates: UpdateBidInput = { clientViewed: viewed };
  if (viewed) {
    updates.status = "viewed";
  }
  return updateBid(bidId, updates);
}

export async function markClientResponded(bidId: string, responded: boolean) {
  const updates: UpdateBidInput = {
    clientResponded: responded,
    jobResponse: responded ? ("replied" as JobResponse) : ("no_response" as JobResponse),
  };
  if (responded) {
    updates.status = "responded";
  }
  return updateBid(bidId, updates);
}

export async function getBids(filters?: {
  status?: BidStatus[];
  bidderId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("bids")
    .select(
      `
      *,
      profiles:bidder_id (id, full_name, email, avatar_url),
      sources (id, name, color)
    `
    )
    .order("created_at", { ascending: false });

  if (filters?.status?.length) {
    query = query.in("status", filters.status);
  }
  if (filters?.bidderId) {
    query = query.eq("bidder_id", filters.bidderId);
  }
  if (filters?.fromDate) {
    query = query.gte("date_est", filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte("date_est", filters.toDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getBid(bidId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bids")
    .select(
      `
      *,
      profiles:bidder_id (id, full_name, email, avatar_url),
      sources (id, name, color),
      similar_bid:similar_bid_id (id, job_title, url, bidder_id)
    `
    )
    .eq("id", bidId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSources() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function getProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .order("full_name");

  if (error) throw new Error(error.message);
  return data;
}

export async function getStatsData(days = 30) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const [bids, profiles] = await Promise.all([
    getBids({ fromDate: from.toISOString() }),
    getProfiles(),
  ]);

  return { bids, profiles, days };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function exportBidsCsv(submittedOnly = false) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const bids = await getBids(
    submittedOnly
      ? {
          status: [
            "submitted",
            "viewed",
            "responded",
            "hired",
            "lost",
            "canceled",
            "no_response",
          ],
        }
      : undefined
  );

  const rows = (bids ?? []).map((bid) => {
    const profile = Array.isArray(bid.profiles)
      ? bid.profiles[0]
      : bid.profiles;
    const source = Array.isArray(bid.sources) ? bid.sources[0] : bid.sources;

    return {
      job_title: bid.job_title,
      url: bid.url,
      status: bid.status,
      job_response: bid.job_response ?? "",
      bidder_name: profile?.full_name ?? "",
      bidder_email: profile?.email ?? "",
      source_name: source?.name ?? "",
      date_est: formatEstDate(bid.date_est),
      time_est: bid.time_est ?? "",
      week_number: bid.week_number ?? "",
      connects_used: bid.connects_used ?? "",
      country: bid.country ?? "",
      client_viewed: bid.client_viewed ? "Yes" : "No",
      client_responded: bid.client_responded ? "Yes" : "No",
      shortlisted: bid.shortlisted ? "Yes" : "No",
      proposal_count_range: bid.proposal_count_range ?? "",
      meghna_remarks: bid.meghna_remarks ?? "",
      summary: bid.summary ?? "",
      questions: bid.questions ?? "",
      proposal: bid.proposal?.replace(/<[^>]+>/g, " ").trim() ?? "",
      bid_submitted_at: bid.bid_submitted_at ?? "",
      created_at: bid.created_at,
    };
  });

  const csv = rowsToCsv(rows, [...BID_EXPORT_COLUMNS]);
  const filename = submittedOnly
    ? `submitted-bids-${new Date().toISOString().slice(0, 10)}.csv`
    : `all-bids-${new Date().toISOString().slice(0, 10)}.csv`;

  return { csv, filename };
}
