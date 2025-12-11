"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import {
  Download,
  RefreshCw,
  Settings,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useStore, useHasData } from "@/state";

export interface HeaderProps {
  onExport?: () => void;
  onReset?: () => void;
  className?: string;
}

export function Header({ onExport, onReset, className }: HeaderProps) {
  const hasData = useHasData();

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
            <Target className="h-5 w-5 text-zinc-900" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">
              Tarkov Stats
            </h1>
            <p className="text-xs text-zinc-500">Log Analytics Dashboard</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          {hasData && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={onReset}
              >
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={onExport}
              >
                <span className="hidden sm:inline">Export</span>
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </header>
  );
}
