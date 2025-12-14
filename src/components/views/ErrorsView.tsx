"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { StatCard, Card, CardHeader, CardTitle, CardContent, EmptyState, ChartContainer } from "@/components/ui";
import type { ErrorInsight } from "@/lib/logs/types";
import { getTopErrorFamilies, getErrorPercentages } from "@/lib/logs/selectors";

export interface ErrorsViewProps {
  errors: ErrorInsight;
}

const COLORS = [
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#a855f7", "#d946ef", "#22c55e", "#0ea5e9",
];

export function ErrorsView({ errors }: ErrorsViewProps) {
  const topFamilies = useMemo(() => getTopErrorFamilies(errors, 15), [errors]);
  const percentages = useMemo(() => getErrorPercentages(errors), [errors]);

  if (errors.total === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No Errors Found"
        description="No errors were detected in the loaded log files. Great job!"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Errors</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Errors"
          value={errors.total}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Error Families"
          value={topFamilies.length}
          color="zinc"
        />
        {errors.firstAt && (
          <StatCard
            label="First Error"
            value={new Date(errors.firstAt).toLocaleDateString()}
            subtext={new Date(errors.firstAt).toLocaleTimeString()}
            icon={Calendar}
            color="zinc"
          />
        )}
      </div>

      {/* Chart */}
      {topFamilies.length > 0 && (
        <ChartContainer title="Errors by Family" height={400}>
          <div className="w-full h-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topFamilies}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" stroke="#71717a" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="family"
                  stroke="#71717a"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fafafa" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topFamilies.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      )}

      {/* Table */}
      <Card variant="glass" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Family</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">Count</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {percentages.map((row, idx) => (
                <motion.tr
                  key={row.family}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-zinc-200">{row.family}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-zinc-200">
                    {row.count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-zinc-400">
                    {row.percentage.toFixed(1)}%
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
