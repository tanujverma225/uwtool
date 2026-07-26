import { AppShell } from "@/components/layout/app-shell";
import {
  TeamStatsTable,
  WeeklyViewsChart,
} from "@/components/stats/stats-dashboard";
import { getStatsData } from "@/lib/actions/bids";
import {
  computeTeamStats,
  computeWeeklyViews,
  groupWeeklyViewsForChart,
} from "@/lib/stats";
import type { BidWithRelations } from "@/types/database";

export default async function StatsPage() {
  const days = 30;
  const { bids, profiles } = await getStatsData(days);

  const stats = computeTeamStats(
    (bids ?? []) as BidWithRelations[],
    profiles ?? []
  );

  const weeklyViews = computeWeeklyViews(
    (bids ?? []) as BidWithRelations[],
    profiles ?? []
  );

  const chartData = groupWeeklyViewsForChart(weeklyViews);
  const people = [...new Set(weeklyViews.map((r) => r.personName))];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">% Bids Response</h1>
          <p className="text-muted-foreground">
            Team performance metrics and weekly view trends
          </p>
        </div>
        <TeamStatsTable stats={stats} days={days} />
        <WeeklyViewsChart chartData={chartData} people={people} />
      </div>
    </AppShell>
  );
}
