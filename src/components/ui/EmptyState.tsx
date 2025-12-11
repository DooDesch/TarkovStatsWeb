"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { type LucideIcon, Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 py-16 px-8 text-center",
        className
      )}
    >
      <div className="rounded-full bg-zinc-800 p-4">
        <Icon className="h-8 w-8 text-zinc-500" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-200">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
