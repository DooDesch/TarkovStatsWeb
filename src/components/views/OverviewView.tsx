"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  AlertTriangle,
  Crosshair,
  Zap,
  FileText,
  Calendar,
} from "lucide-react";
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import type { Insights, ParsedLogResult } from "@/lib/logs/types";
import {
  getTotalEventCount,
  getUniqueLogTypes,
  getEventCountByLogType,
} from "@/lib/logs/selectors";

export interface OverviewViewProps {
  insights: Insights;
  parsedResults: ParsedLogResult[];
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function OverviewView({ insights, parsedResults }: OverviewViewProps) {
  const totalEvents = useMemo(
    () => getTotalEventCount(parsedResults),
    [parsedResults]
  );
  const logTypes = useMemo(
    () => getUniqueLogTypes(parsedResults),
    [parsedResults]
  );
  const eventsByType = useMemo(
    () => getEventCountByLogType(parsedResults),
    [parsedResults]
  );

  const sortedEventTypes = useMemo(() => {
    return Object.entries(eventsByType).sort((a, b) => b[1] - a[1]);
  }, [eventsByType]);

  const avgMatchTime = insights.matching.averageDurationMs;
  const avgStartupTime = insights.startup.averageDurationMs;

  const timeRange = useMemo(() => {
    const timestamps: number[] = [];
    parsedResults.forEach((r) => {
      if (r.meta.earliestTimestamp) {
        const t = Date.parse(r.meta.earliestTimestamp);
        if (!Number.isNaN(t)) timestamps.push(t);
      }
      if (r.meta.latestTimestamp) {
        const t = Date.parse(r.meta.latestTimestamp);
        if (!Number.isNaN(t)) timestamps.push(t);
      }
    });
    if (timestamps.length === 0) return null;
    const start = new Date(Math.min(...timestamps));
    const end = new Date(Math.max(...timestamps));
    return { start, end };
  }, [parsedResults]);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Stats Grid */}
      <motion.div variants={fadeInUp}>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Events"
            value={totalEvents}
            icon={Activity}
            color="amber"
          />
          <StatCard
            label="Log Types"
            value={logTypes.length}
            icon={FileText}
            color="blue"
          />
          <StatCard
            label="Sessions"
            value={insights.timelines.length}
            icon={Clock}
            color="purple"
          />
          <StatCard
            label="Errors"
            value={insights.errors.total}
            icon={AlertTriangle}
            color={insights.errors.total > 0 ? "red" : "green"}
          />
          <StatCard
            label="Avg Match Time"
            value={avgMatchTime ? `${(avgMatchTime / 1000).toFixed(1)}s` : "N/A"}
            icon={Crosshair}
            color="amber"
          />
          <StatCard
            label="Avg Startup"
            value={avgStartupTime ? `${(avgStartupTime / 1000).toFixed(1)}s` : "N/A"}
            icon={Zap}
            color="green"
          />
        </div>
      </motion.div>

      {/* Time Range */}
      {timeRange && (
        <motion.div variants={fadeInUp}>
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Data Time Range</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>From:</span>
                <span className="font-medium">
                  {timeRange.start.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>To:</span>
                <span className="font-medium">
                  {timeRange.end.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Logs by Type */}
      <motion.div variants={fadeInUp}>
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Events by Log Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sortedEventTypes.map(([type, count]) => (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-lg bg-zinc-800/30 p-3 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors"
                >
                  <div className="text-xs text-zinc-500 truncate mb-1">
                    {type}
                  </div>
                  <div className="text-lg font-semibold text-zinc-200">
                    {count.toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-6">
        {/* Inventory Quick Stats */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Inventory Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-400">Total Rejections</span>
              <span
                className={
                  insights.inventory.totalRejections > 0
                    ? "text-red-400 font-medium"
                    : "text-emerald-400 font-medium"
                }
              >
                {insights.inventory.totalRejections}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-400">Operation Types</span>
              <span className="text-zinc-200 font-medium">
                {Object.keys(insights.inventory.byOperation).length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-zinc-400">Error Codes</span>
              <span className="text-zinc-200 font-medium">
                {Object.keys(insights.inventory.byCode).length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Network Quick Stats */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Connectivity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-400">Total Connections</span>
              <span className="text-emerald-400 font-medium">
                {insights.connectivity.totalConnections}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-400">Timeouts</span>
              <span
                className={
                  insights.connectivity.totalTimeouts > 0
                    ? "text-red-400 font-medium"
                    : "text-emerald-400 font-medium"
                }
              >
                {insights.connectivity.totalTimeouts}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-zinc-400">Unique Addresses</span>
              <span className="text-zinc-200 font-medium">
                {Object.keys(insights.connectivity.byAddress).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
