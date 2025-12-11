"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react";

export type StatColor = "amber" | "red" | "green" | "blue" | "purple" | "cyan" | "zinc";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: StatColor;
  icon?: LucideIcon;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  loading?: boolean;
  className?: string;
}

const colorMap: Record<StatColor, { bg: string; border: string; text: string; glow: string }> = {
  amber: {
    bg: "from-amber-500/15 to-amber-600/5",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
  red: {
    bg: "from-red-500/15 to-red-600/5",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/10",
  },
  green: {
    bg: "from-emerald-500/15 to-emerald-600/5",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  blue: {
    bg: "from-blue-500/15 to-blue-600/5",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  purple: {
    bg: "from-purple-500/15 to-purple-600/5",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/10",
  },
  cyan: {
    bg: "from-cyan-500/15 to-cyan-600/5",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/10",
  },
  zinc: {
    bg: "from-zinc-700/30 to-zinc-800/20",
    border: "border-zinc-700/50",
    text: "text-zinc-300",
    glow: "",
  },
};

const trendIcons: Record<"up" | "down" | "neutral", LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors: Record<"up" | "down" | "neutral", string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-zinc-400",
};

export function StatCard({
  label,
  value,
  subtext,
  color = "zinc",
  icon: Icon,
  trend,
  loading = false,
  className,
}: StatCardProps) {
  const colors = colorMap[color];
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "relative overflow-hidden rounded-xl border p-5",
        "bg-gradient-to-br",
        colors.bg,
        colors.border,
        colors.glow && `shadow-lg ${colors.glow}`,
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-current blur-2xl" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-zinc-400">{label}</span>
          {Icon && (
            <Icon className={clsx("h-5 w-5", colors.text)} strokeWidth={1.5} />
          )}
        </div>

        {loading ? (
          <div className="mt-2 h-9 w-24 animate-pulse rounded bg-zinc-700/50" />
        ) : (
          <div className={clsx("mt-2 text-3xl font-bold tracking-tight", colors.text)}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          {subtext && (
            <span className="text-sm text-zinc-500">{subtext}</span>
          )}
          {trend && TrendIcon && (
            <span className={clsx("flex items-center gap-1 text-xs", trendColors[trend.direction])}>
              <TrendIcon className="h-3 w-3" />
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
