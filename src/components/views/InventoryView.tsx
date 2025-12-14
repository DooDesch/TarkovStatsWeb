"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Package, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { StatCard, Card, EmptyState, ChartContainer } from "@/components/ui";
import type { InventoryInsight } from "@/lib/logs/types";
import { getTopInventoryOperations, getTopInventoryCodes } from "@/lib/logs/selectors";

export interface InventoryViewProps {
  inventory: InventoryInsight;
}

const COLORS = [
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export function InventoryView({ inventory }: InventoryViewProps) {
  const topOperations = useMemo(() => getTopInventoryOperations(inventory, 10), [inventory]);
  const topCodes = useMemo(() => getTopInventoryCodes(inventory, 10), [inventory]);

  const pieData = useMemo(() => {
    return topOperations.map((op) => ({
      name: op.operation,
      value: op.count,
    }));
  }, [topOperations]);

  // Size guards to avoid Recharts width/height -1 warnings
  const pieRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [pieReady, setPieReady] = useState(false);
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    const observers: ResizeObserver[] = [];

    if (pieRef.current) {
      const obs = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setPieReady(width > 0 && height > 0);
      });
      obs.observe(pieRef.current);
      observers.push(obs);
    }

    if (barRef.current) {
      const obs = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setBarReady(width > 0 && height > 0);
      });
      obs.observe(barRef.current);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  if (inventory.totalRejections === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No Inventory Rejections"
        description="No inventory operation rejections found in the loaded logs"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Inventory Operations</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Rejections"
          value={inventory.totalRejections}
          icon={Package}
          color="amber"
        />
        <StatCard
          label="Operation Types"
          value={topOperations.length}
          color="zinc"
        />
        <StatCard
          label="Error Codes"
          value={topCodes.length}
          color="zinc"
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart - By Operation */}
        {pieData.length > 0 && (
          <ChartContainer title="By Operation Type" height={280}>
            <div ref={pieRef} className="w-full h-full min-h-[240px]">
              {pieReady && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        (percent ?? 0) > 0.05 ? `${name} (${((percent ?? 0) * 100).toFixed(0)}%)` : ""
                      }
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              )}
            </div>
          </ChartContainer>
        )}

        {/* Bar Chart - By Error Code */}
        {topCodes.length > 0 && (
          <ChartContainer title="By Error Code" height={280}>
            <div ref={barRef} className="w-full h-full min-h-[240px]">
              {barReady && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCodes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="code" stroke="#71717a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartContainer>
        )}
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Operations Table */}
        <Card variant="glass" padding="none">
          <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
            <h3 className="font-medium text-zinc-200">Operations Breakdown</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y divide-zinc-800">
                {topOperations.map((row, idx) => (
                  <tr key={row.operation} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-zinc-200">{row.operation}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-zinc-200">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Error Codes Table */}
        <Card variant="glass" padding="none">
          <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
            <h3 className="font-medium text-zinc-200">Error Codes</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y divide-zinc-800">
                {topCodes.map((row) => (
                  <tr key={row.code} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-sm font-mono text-zinc-200">{row.code}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-zinc-200">
                      {row.count}
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
