"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { StatCard, Card, EmptyState, ChartContainer, Progress } from "@/components/ui";
import type { ConnectivityInsight, NetworkStats } from "@/lib/logs/types";
import { getConnectionSuccessRate, getTopAddresses } from "@/lib/logs/selectors";

export interface NetworkViewProps {
  connectivity: ConnectivityInsight;
  /** Optional network statistics with additional metrics (RTT, packet loss) */
  networkStats?: NetworkStats;
}

export function NetworkView({ connectivity, networkStats }: NetworkViewProps) {
  const successRate = useMemo(() => getConnectionSuccessRate(connectivity), [connectivity]);
  const topAddresses = useMemo(() => getTopAddresses(connectivity, 15), [connectivity]);

  const chartData = useMemo(() => {
    return topAddresses.map((addr) => ({
      address: addr.address.length > 25 ? `${addr.address.slice(0, 22)}...` : addr.address,
      fullAddress: addr.address,
      connections: addr.connections,
      timeouts: addr.timeouts,
    }));
  }, [topAddresses]);

  const isEmpty = connectivity.totalConnections === 0 && connectivity.totalTimeouts === 0;
  
  const hasMetrics = networkStats?.metrics && (
    networkStats.metrics.rttAvg !== undefined ||
    networkStats.metrics.rpiAvg !== undefined ||
    networkStats.metrics.totalPacketsLost !== undefined
  );

  if (isEmpty) {
    return (
      <EmptyState
        icon={Wifi}
        title="No Network Data"
        description="No network connection events found in the loaded logs"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Network Connectivity</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Connections"
          value={connectivity.totalConnections}
          icon={Wifi}
          color="green"
        />
        <StatCard
          label="Total Timeouts"
          value={connectivity.totalTimeouts}
          icon={WifiOff}
          color={connectivity.totalTimeouts > 0 ? "red" : "green"}
        />
        <StatCard
          label="Unique Addresses"
          value={Object.keys(connectivity.byAddress).length}
          color="zinc"
        />
      </div>

      {/* Success Rate */}
      {connectivity.totalConnections > 0 && (
        <Card variant="glass">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-zinc-200">Connection Success Rate</h3>
            <span className="text-2xl font-bold text-emerald-400">
              {successRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={successRate} color="green" size="lg" />
        </Card>
      )}

      {/* Network Quality Metrics */}
      {hasMetrics && networkStats?.metrics && (
        <Card variant="glass">
          <h3 className="text-lg font-medium text-zinc-200 mb-4">Network Quality Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {networkStats.metrics.rttAvg !== undefined && (
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/30">
                <div className="text-xs text-zinc-500 mb-1">Avg RTT</div>
                <div className={`text-lg font-semibold ${networkStats.metrics.rttAvg < 100 ? "text-emerald-400" : networkStats.metrics.rttAvg < 200 ? "text-amber-400" : "text-red-400"}`}>
                  {networkStats.metrics.rttAvg.toFixed(1)}ms
                </div>
              </div>
            )}
            {networkStats.metrics.rpiAvg !== undefined && (
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/30">
                <div className="text-xs text-zinc-500 mb-1">Avg RPI</div>
                <div className="text-lg font-semibold text-zinc-200">
                  {networkStats.metrics.rpiAvg.toFixed(1)}
                </div>
              </div>
            )}
            {networkStats.metrics.ludAvg !== undefined && (
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/30">
                <div className="text-xs text-zinc-500 mb-1">Avg LUD</div>
                <div className="text-lg font-semibold text-zinc-200">
                  {networkStats.metrics.ludAvg.toFixed(1)}
                </div>
              </div>
            )}
            {networkStats.metrics.totalPacketsLost !== undefined && (
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/30">
                <div className="text-xs text-zinc-500 mb-1">Packets Lost</div>
                <div className={`text-lg font-semibold ${networkStats.metrics.totalPacketsLost === 0 ? "text-emerald-400" : networkStats.metrics.totalPacketsLost < 100 ? "text-amber-400" : "text-red-400"}`}>
                  {networkStats.metrics.totalPacketsLost.toLocaleString()}
                </div>
              </div>
            )}
            {networkStats.metrics.totalPacketsSent !== undefined && (
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/30">
                <div className="text-xs text-zinc-500 mb-1">Packets Sent</div>
                <div className="text-lg font-semibold text-zinc-200">
                  {networkStats.metrics.totalPacketsSent.toLocaleString()}
                </div>
              </div>
            )}
            {networkStats.metrics.totalPacketsReceived !== undefined && (
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/30">
                <div className="text-xs text-zinc-500 mb-1">Packets Received</div>
                <div className="text-lg font-semibold text-zinc-200">
                  {networkStats.metrics.totalPacketsReceived.toLocaleString()}
                </div>
              </div>
            )}
            {networkStats.metrics.samples > 0 && (
              <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/30">
                <div className="text-xs text-zinc-500 mb-1">Metric Samples</div>
                <div className="text-lg font-semibold text-zinc-200">
                  {networkStats.metrics.samples.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <ChartContainer title="Connections by Address" height={400}>
          <div className="w-full h-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 130, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" stroke="#71717a" />
                <YAxis
                  type="category"
                  dataKey="address"
                  stroke="#71717a"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [value, name === "connections" ? "Connections" : "Timeouts"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullAddress || ""}
                />
                <Legend />
                <Bar dataKey="connections" fill="#22c55e" radius={[0, 4, 4, 0]} name="Connections" />
                <Bar dataKey="timeouts" fill="#ef4444" radius={[0, 4, 4, 0]} name="Timeouts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      )}

      {/* Address Table */}
      <Card variant="glass" padding="none">
        <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
          <h3 className="font-medium text-zinc-200">All Addresses</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/30 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium text-zinc-400">Address</th>
                <th className="text-right px-4 py-2 text-sm font-medium text-zinc-400">Connections</th>
                <th className="text-right px-4 py-2 text-sm font-medium text-zinc-400">Timeouts</th>
                <th className="text-right px-4 py-2 text-sm font-medium text-zinc-400">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {topAddresses.map((addr) => (
                <motion.tr
                  key={addr.address}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-2 text-sm font-mono text-zinc-200 truncate max-w-xs" title={addr.address}>
                    {addr.address}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-emerald-400">{addr.connections}</td>
                  <td className="px-4 py-2 text-sm text-right text-red-400">{addr.timeouts}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <span
                      className={
                        addr.rate >= 90 ? "text-emerald-400" : addr.rate >= 70 ? "text-amber-400" : "text-red-400"
                      }
                    >
                      {addr.rate.toFixed(0)}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
