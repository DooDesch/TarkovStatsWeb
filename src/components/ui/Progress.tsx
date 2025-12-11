"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "amber" | "green" | "red" | "blue";
  className?: string;
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const colorClasses = {
  amber: "bg-gradient-to-r from-amber-500 to-amber-400",
  green: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  red: "bg-gradient-to-r from-red-500 to-red-400",
  blue: "bg-gradient-to-r from-blue-500 to-blue-400",
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  color = "amber",
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-zinc-400">{label}</span>}
          {showValue && (
            <span className="font-medium text-zinc-300">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          "overflow-hidden rounded-full bg-zinc-800",
          sizeClasses[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={clsx("h-full rounded-full", colorClasses[color])}
        />
      </div>
    </div>
  );
}
