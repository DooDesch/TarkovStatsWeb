"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Crosshair, Zap, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { StatCard, Card, EmptyState, ChartContainer } from "@/components/ui";
import type { Insights } from "@/lib/logs/types";
import { getMatchingTimeData, getStartupTimeData } from "@/lib/logs/selectors";

export interface MatchingViewProps {
  insights: Insights;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function MatchingView({ insights }: MatchingViewProps) {
  const matchData = useMemo(() => getMatchingTimeData(insights), [insights]);
  const startupData = useMemo(() => getStartupTimeData(insights), [insights]);

  const noData = matchData.length === 0 && startupData.length === 0;

  if (noData) {
    return (
      <EmptyState
        icon={Crosshair}
        title="No Matchmaking Data"
        description="No matchmaking or startup timing data available in the loaded logs"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Matchmaking & Startup</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Avg Match Time"
          value={insights.matching.averageDurationMs ? formatDuration(insights.matching.averageDurationMs) : "N/A"}
          icon={Crosshair}
          color="amber"
        />
        <StatCard
          label="Match Sessions"
          value={insights.matching.sessions.length}
          color="zinc"
        />
        <StatCard
          label="Avg Startup"
          value={insights.startup.averageDurationMs ? formatDuration(insights.startup.averageDurationMs) : "N/A"}
          icon={Zap}
          color="green"
        />
        <StatCard
          label="Startup Sessions"
          value={insights.startup.sessions.length}
          color="zinc"
        />
      </div>

      {/* Match Time Chart */}
      {matchData.length > 0 && (
        <ChartContainer title="Matchmaking Duration Over Time" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={matchData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
              <YAxis stroke="#71717a" unit="s" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value.toFixed(1)}s`, "Match Time"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="durationSec"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#f59e0b" }}
                name="Match Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Startup Time Chart */}
      {startupData.length > 0 && (
        <ChartContainer title="Startup Duration Over Time" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={startupData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
              <YAxis stroke="#71717a" unit="s" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value.toFixed(1)}s`, "Startup Time"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="durationSec"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#22c55e" }}
                name="Startup Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Session Details Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Matching Sessions */}
        {insights.matching.sessions.length > 0 && (
          <Card variant="glass" padding="none">
            <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
              <h3 className="font-medium text-zinc-200">Matching Sessions</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/30 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-zinc-400">Time</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-zinc-400">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {insights.matching.sessions
                    .filter((s) => s.startedAt)
                    .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime())
                    .map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-2 text-sm text-zinc-300">{formatDate(s.startedAt!)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-amber-400">
                          {s.durationMs !== undefined ? formatDuration(s.durationMs) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Startup Sessions */}
        {insights.startup.sessions.length > 0 && (
          <Card variant="glass" padding="none">
            <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
              <h3 className="font-medium text-zinc-200">Startup Sessions</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/30 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-zinc-400">Time</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-zinc-400">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {insights.startup.sessions
                    .filter((s) => s.startedAt)
                    .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime())
                    .map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-2 text-sm text-zinc-300">{formatDate(s.startedAt!)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-emerald-400">
                          {s.durationMs !== undefined ? formatDuration(s.durationMs) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
