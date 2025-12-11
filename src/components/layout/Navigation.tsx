"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  AlertTriangle,
  Package,
  Wifi,
  Crosshair,
  ScrollText,
  Database,
  type LucideIcon,
} from "lucide-react";
import { useStore, type TabId } from "@/state";

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  shortLabel?: string;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview", icon: LayoutDashboard },
  { id: "sessions", label: "Sessions", shortLabel: "Sessions", icon: Clock },
  { id: "errors", label: "Errors", shortLabel: "Errors", icon: AlertTriangle },
  { id: "inventory", label: "Inventory", shortLabel: "Inventory", icon: Package },
  { id: "network", label: "Network", shortLabel: "Network", icon: Wifi },
  { id: "matching", label: "Matchmaking", shortLabel: "Match", icon: Crosshair },
  { id: "quests", label: "Quests", shortLabel: "Quests", icon: ScrollText },
  { id: "raw", label: "Raw Data", shortLabel: "Raw", icon: Database },
];

export interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  return (
    <nav
      className={clsx(
        "flex gap-1 overflow-x-auto scrollbar-none px-1 py-1 rounded-xl bg-zinc-900/50 border border-zinc-800/50",
        className
      )}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              "relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
              isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 rounded-lg bg-amber-500 shadow-lg shadow-amber-500/20"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10 hidden md:inline">{item.label}</span>
            <span className="relative z-10 md:hidden">{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
