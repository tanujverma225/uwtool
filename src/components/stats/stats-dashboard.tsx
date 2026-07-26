"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/stats";
import type { TeamStatsRow } from "@/types/database";

interface TeamStatsTableProps {
  stats: TeamStatsRow[];
  days: number;
}

export function TeamStatsTable({ stats, days }: TeamStatsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Response</CardTitle>
        <p className="text-sm text-muted-foreground">
          Date: Last {days} days
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>People</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
                <TableHead className="text-right">Response</TableHead>
                <TableHead className="text-right">R %</TableHead>
                <TableHead className="text-right">View</TableHead>
                <TableHead className="text-right">V %</TableHead>
                <TableHead className="text-right">Hired</TableHead>
                <TableHead className="text-right">H %</TableHead>
                <TableHead className="text-right">Connects</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((row) => (
                <TableRow key={row.personId}>
                  <TableCell className="font-medium">{row.personName}</TableCell>
                  <TableCell className="text-right">{row.submitted}</TableCell>
                  <TableCell className="text-right">{row.response}</TableCell>
                  <TableCell className="text-right">{row.responsePct}%</TableCell>
                  <TableCell className="text-right">{row.view}</TableCell>
                  <TableCell className="text-right">{row.viewPct}%</TableCell>
                  <TableCell className="text-right">{row.hired}</TableCell>
                  <TableCell className="text-right">{row.hiredPct}%</TableCell>
                  <TableCell className="text-right">{row.connects}</TableCell>
                </TableRow>
              ))}
              {!stats.length && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                    No stats for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface WeeklyViewsChartProps {
  chartData: Record<string, string | number>[];
  people: string[];
}

export function WeeklyViewsChart({ chartData, people }: WeeklyViewsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Views</CardTitle>
      </CardHeader>
      <CardContent>
        {!chartData.length ? (
          <p className="text-muted-foreground text-center py-12">
            No view data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="weekNumber"
                tick={{ fontSize: 12 }}
                label={{ value: "Week Number", position: "insideBottom", offset: -5 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {people.map((person, i) => (
                <Bar
                  key={person}
                  dataKey={person}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
