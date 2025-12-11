"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ScrollText, Search, Filter } from "lucide-react";
import { StatCard, Card, Badge, EmptyState, Button } from "@/components/ui";
import type { QuestInsight } from "@/lib/logs/types";
import { filterQuests, getQuestStats, getUniqueTraders } from "@/lib/logs/selectors";

export interface QuestsViewProps {
  quests: QuestInsight[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

const statusVariants: Record<QuestInsight["status"], "info" | "success" | "error" | "default"> = {
  started: "info",
  completed: "success",
  failed: "error",
  unknown: "default",
};

export function QuestsView({ quests }: QuestsViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuestInsight["status"] | "all">("all");

  const stats = useMemo(() => getQuestStats(quests), [quests]);
  const traders = useMemo(() => getUniqueTraders(quests), [quests]);

  const filteredQuests = useMemo(() => {
    return filterQuests(quests, {
      status: statusFilter === "all" ? undefined : [statusFilter],
      searchQuery: search || undefined,
    }).sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [quests, statusFilter, search]);

  if (quests.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No Quest Data"
        description="No quest events found in the loaded log files"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Quests</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Quests" value={stats.total} color="zinc" />
        <StatCard label="Started" value={stats.started} color="blue" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Failed" value={stats.failed} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, ID, or trader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "started", "completed", "failed"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "primary" : "secondary"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Quest Table */}
      <Card variant="glass" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Quest</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Trader</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Started</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Completed/Failed</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredQuests.map((quest, idx) => (
                <motion.tr
                  key={quest.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-200">{quest.name || "Unknown Quest"}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{quest.id}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {quest.traderName || quest.traderId || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariants[quest.status]}>
                      {quest.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {quest.startedAt ? formatDate(quest.startedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {quest.completedAt
                      ? formatDate(quest.completedAt)
                      : quest.failedAt
                      ? formatDate(quest.failedAt)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-zinc-300">
                    {quest.relatedEvents.length}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredQuests.length === 0 && (
          <div className="text-center text-zinc-500 py-12">
            No quests match your filter
          </div>
        )}
      </Card>
    </div>
  );
}
