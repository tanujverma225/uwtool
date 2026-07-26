import { SUBMITTED_STATUSES } from "@/db/schema";
import type { BidWithRelations, TeamStatsRow, WeeklyViewRow } from "@/types/database";
import { pct } from "@/lib/dates";

export function computeTeamStats(
  bids: BidWithRelations[],
  profiles: { id: string; full_name: string }[]
): TeamStatsRow[] {
  const byPerson = new Map<string, TeamStatsRow>();

  for (const profile of profiles) {
    byPerson.set(profile.id, {
      personId: profile.id,
      personName: profile.full_name,
      submitted: 0,
      response: 0,
      responsePct: 0,
      view: 0,
      viewPct: 0,
      hired: 0,
      hiredPct: 0,
      connects: 0,
    });
  }

  for (const bid of bids) {
    if (!SUBMITTED_STATUSES.includes(bid.status)) continue;

    const stats = byPerson.get(bid.bidder_id);
    if (!stats) continue;

    stats.submitted += 1;
    if (bid.client_responded) stats.response += 1;
    if (bid.client_viewed) stats.view += 1;
    if (bid.status === "hired" || bid.job_response === "hired") stats.hired += 1;
    stats.connects += bid.connects_used ?? 0;
  }

  for (const stats of byPerson.values()) {
    stats.responsePct = pct(stats.response, stats.submitted);
    stats.viewPct = pct(stats.view, stats.submitted);
    stats.hiredPct = pct(stats.hired, stats.submitted);
  }

  return Array.from(byPerson.values()).sort(
    (a, b) => b.submitted - a.submitted
  );
}

export function computeWeeklyViews(
  bids: BidWithRelations[],
  profiles: { id: string; full_name: string }[]
): WeeklyViewRow[] {
  const map = new Map<string, WeeklyViewRow>();

  for (const bid of bids) {
    if (!bid.client_viewed || !bid.week_number) continue;

    const key = `${bid.week_number}:${bid.bidder_id}`;
    const person = profiles.find((p) => p.id === bid.bidder_id);
    const existing = map.get(key);

    if (existing) {
      existing.views += 1;
    } else {
      map.set(key, {
        weekNumber: bid.week_number,
        personId: bid.bidder_id,
        personName: person?.full_name ?? "Unknown",
        views: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const [weekA, yearA] = a.weekNumber.split(" ").map(Number);
    const [weekB, yearB] = b.weekNumber.split(" ").map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return weekA - weekB;
  });
}

export function groupWeeklyViewsForChart(rows: WeeklyViewRow[]) {
  const weeks = [...new Set(rows.map((r) => r.weekNumber))].sort((a, b) => {
    const [weekA, yearA] = a.split(" ").map(Number);
    const [weekB, yearB] = b.split(" ").map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return weekA - weekB;
  });

  const people = [...new Set(rows.map((r) => r.personName))];

  return weeks.map((week) => {
    const entry: Record<string, string | number> = { weekNumber: week };
    for (const person of people) {
      const match = rows.find(
        (r) => r.weekNumber === week && r.personName === person
      );
      entry[person] = match?.views ?? 0;
    }
    return entry;
  });
}

export const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(43, 74%, 49%)",
  "hsl(142, 71%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
];
