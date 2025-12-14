"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Server, RefreshCw, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { StatCard, Card, EmptyState, ChartContainer, Progress } from "@/components/ui";
import type { BackendStats, CacheStats } from "@/lib/logs/types";

export interface BackendViewProps {
  backend: BackendStats;
  cache: CacheStats;
}

const COLORS = [
  "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export function BackendView({ backend, cache }: BackendViewProps) {
  const isEmpty = backend.totalRequests === 0 && backend.totalResponses === 0;

  const statusCodeData = useMemo(() => {
    return Object.entries(backend.byStatusCode)
      .map(([code, count]) => ({
        code,
        count,
        color: code.startsWith("2") ? "#22c55e" : code.startsWith("5") ? "#ef4444" : "#f59e0b",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [backend.byStatusCode]);

  const endpointData = useMemo(() => {
    return Object.entries(backend.byEndpoint)
      .map(([endpoint, count]) => ({
        endpoint: endpoint.length > 40 ? `...${endpoint.slice(-37)}` : endpoint,
        fullEndpoint: endpoint,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [backend.byEndpoint]);

  const cacheHitRate = useMemo(() => {
    const total = cache.hits + cache.misses;
    return total > 0 ? (cache.hits / total) * 100 : 0;
  }, [cache]);

  const successRate = useMemo(() => {
    const total = backend.totalResponses + backend.totalErrors;
    return total > 0 ? (backend.totalResponses / total) * 100 : 100;
  }, [backend]);

  if (isEmpty) {
    return (
      <EmptyState
        icon={Server}
        title="No Backend Data"
        description="No backend request/response events found in the loaded logs"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Backend & Cache</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Requests"
          value={backend.totalRequests}
          icon={Server}
          color="blue"
        />
        <StatCard
          label="Total Responses"
          value={backend.totalResponses}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Errors"
          value={backend.totalErrors}
          icon={AlertCircle}
          color={backend.totalErrors > 0 ? "red" : "green"}
        />
        <StatCard
          label="Retries"
          value={backend.retries}
          icon={RefreshCw}
          color={backend.retries > 0 ? "amber" : "green"}
        />
        <StatCard
          label="Cache Hits"
          value={cache.hits}
          icon={Database}
          color="green"
        />
        <StatCard
          label="Cache Misses"
          value={cache.misses}
          color="amber"
        />
      </div>

      {/* Success & Cache Rate */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="glass">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-zinc-200">Backend Success Rate</h3>
            <span className={`text-2xl font-bold ${successRate >= 95 ? "text-emerald-400" : successRate >= 80 ? "text-amber-400" : "text-red-400"}`}>
              {successRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={successRate} color={successRate >= 95 ? "green" : successRate >= 80 ? "amber" : "red"} size="lg" />
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-zinc-200">Cache Hit Rate</h3>
            <span className={`text-2xl font-bold ${cacheHitRate >= 50 ? "text-emerald-400" : cacheHitRate >= 25 ? "text-amber-400" : "text-red-400"}`}>
              {cacheHitRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={cacheHitRate} color={cacheHitRate >= 50 ? "green" : cacheHitRate >= 25 ? "amber" : "red"} size="lg" />
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Codes Chart */}
        {statusCodeData.length > 0 && (
          <ChartContainer title="Response Status Codes" height={280}>
            <div className="w-full h-full min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCodeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      (percent ?? 0) > 0.05 ? `${name} (${((percent ?? 0) * 100).toFixed(0)}%)` : ""
                    }
                    outerRadius={80}
                    dataKey="count"
                    nameKey="code"
                  >
                    {statusCodeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        )}

        {/* Cache Pie Chart */}
        {(cache.hits > 0 || cache.misses > 0) && (
          <ChartContainer title="Cache Performance" height={280}>
            <div className="w-full h-full min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Hits", value: cache.hits },
                      { name: "Misses", value: cache.misses },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        )}
      </div>

      {/* Endpoints Chart */}
      {endpointData.length > 0 && (
        <ChartContainer title="Top Endpoints" height={400}>
          <div className="w-full h-full min-h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={endpointData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" stroke="#71717a" />
                <YAxis
                  type="category"
                  dataKey="endpoint"
                  stroke="#71717a"
                  width={190}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullEndpoint || ""}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      )}

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Codes Table */}
        <Card variant="glass" padding="none">
          <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
            <h3 className="font-medium text-zinc-200">Status Codes</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y divide-zinc-800">
                {statusCodeData.map((row) => (
                  <tr key={row.code} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-mono text-zinc-200">{row.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-zinc-200">
                      {row.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Endpoints Table */}
        <Card variant="glass" padding="none">
          <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
            <h3 className="font-medium text-zinc-200">Top Endpoints</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y divide-zinc-800">
                {endpointData.slice(0, 10).map((row) => (
                  <tr key={row.fullEndpoint} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-sm text-zinc-200 truncate max-w-xs" title={row.fullEndpoint}>
                      {row.endpoint}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-zinc-200">
                      {row.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
