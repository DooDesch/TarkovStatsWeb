"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Volume2, Bell, Shield, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { StatCard, Card, EmptyState, ChartContainer, Progress, Badge } from "@/components/ui";
import type { PushStats, AudioStats, AntiCheatStats } from "@/lib/logs/types";

export interface AudioViewProps {
  push: PushStats;
  audio: AudioStats;
  anticheat: AntiCheatStats;
}

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

export function AudioView({ push, audio, anticheat }: AudioViewProps) {
  const formatPercentLabel = (percent?: number) => {
    if (percent === undefined) return "0%";
    const value = (percent ?? 0) * 100;
    if (value > 0 && value < 0.1) return "<0.1%";
    // one decimal for small slices, integer for larger ones
    return value >= 10 ? `${value.toFixed(0)}%` : `${value.toFixed(1)}%`;
  };

  const isEmpty = 
    push.connections === 0 && 
    push.notifications === 0 && 
    audio.initSuccess === 0 && 
    anticheat.initLines === 0;

  const { deliveryRatePct, dropRatePct } = useMemo(() => {
    const total = push.notifications + push.drops;
    const delivery = total > 0 ? (push.notifications / total) * 100 : 100;
    const drop = total > 0 ? (push.drops / total) * 100 : 0;
    return { deliveryRatePct: delivery, dropRatePct: drop };
  }, [push]);

  const pushPieData = useMemo(() => {
    if (push.notifications === 0 && push.drops === 0) return [];
    return [
      { name: "Delivered", value: push.notifications },
      { name: "Dropped", value: push.drops },
    ];
  }, [push]);

  const audioPieData = useMemo(() => {
    if (audio.initSuccess === 0 && audio.occlusionErrors === 0) return [];
    return [
      { name: "Init Success", value: audio.initSuccess },
      { name: "Occlusion Errors", value: audio.occlusionErrors },
    ];
  }, [audio]);

  if (isEmpty) {
    return (
      <EmptyState
        icon={Volume2}
        title="No Audio/Push/AntiCheat Data"
        description="No push notification, spatial audio, or anti-cheat events found in the loaded logs"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-100">Push, Audio & Anti-Cheat</h2>

      {/* Push Notifications Section */}
      <Card variant="glass">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-medium text-zinc-200">Push Notifications</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Connections"
            value={push.connections}
            color="blue"
          />
          <StatCard
            label="Notifications"
            value={push.notifications}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            label="Dropped"
            value={push.drops}
            icon={XCircle}
            color={push.drops > 0 ? "red" : "green"}
          />
          <div className="flex flex-col justify-center">
            <span className="text-xs text-zinc-500 mb-1">Delivery Rate</span>
            <span className={`text-xl font-bold ${deliveryRatePct >= 95 ? "text-emerald-400" : deliveryRatePct >= 80 ? "text-amber-400" : "text-red-400"}`}>
              {deliveryRatePct.toFixed(1)}%
            </span>
          </div>
        </div>

        {pushPieData.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pushPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${formatPercentLabel(percent)})`}
                  outerRadius={70}
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {pushPieData.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-6 text-sm text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              <span>Delivered ({deliveryRatePct.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
              <span>Dropped ({dropRatePct.toFixed(1)}%)</span>
            </div>
          </div>
        )}
      </Card>

      {/* Spatial Audio Section */}
      <Card variant="glass">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-medium text-zinc-200">Spatial Audio</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Init Success"
            value={audio.initSuccess}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            label="Occlusion Errors"
            value={audio.occlusionErrors}
            icon={AlertTriangle}
            color={audio.occlusionErrors > 0 ? "amber" : "green"}
          />
          <div className="flex flex-col justify-center">
            <span className="text-xs text-zinc-500 mb-1">Audio Health</span>
            <Badge 
              variant={audio.occlusionErrors === 0 ? "success" : audio.occlusionErrors < 10 ? "warning" : "error"}
              size="md"
            >
              {audio.occlusionErrors === 0 ? "Healthy" : audio.occlusionErrors < 10 ? "Minor Issues" : "Issues Detected"}
            </Badge>
          </div>
        </div>

        {audioPieData.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={audioPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${formatPercentLabel(percent)})`}
                  outerRadius={70}
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
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Anti-Cheat Section */}
      <Card variant="glass">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-medium text-zinc-200">BattlEye Anti-Cheat</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Init Lines"
            value={anticheat.initLines}
            color="blue"
          />
          <StatCard
            label="Errors"
            value={anticheat.errors}
            icon={AlertTriangle}
            color={anticheat.errors > 0 ? "red" : "green"}
          />
          <div className="flex flex-col justify-center">
            <span className="text-xs text-zinc-500 mb-1">Status</span>
            <Badge 
              variant={anticheat.errors === 0 ? "success" : "error"}
              size="md"
            >
              {anticheat.errors === 0 ? "Operational" : "Errors Detected"}
            </Badge>
          </div>
        </div>

        {anticheat.lastStatus && (
          <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700/50">
            <span className="text-xs text-zinc-500 block mb-1">Last Status Message</span>
            <code className="text-sm text-zinc-300 font-mono break-all">
              {anticheat.lastStatus}
            </code>
          </div>
        )}
      </Card>
    </div>
  );
}
