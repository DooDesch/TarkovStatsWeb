"use client";

import dynamic from "next/dynamic";
import { ReactNode, Suspense } from "react";
import { Skeleton } from "./Skeleton";

// Lazy load Recharts components
export const LazyResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);

export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);

function ChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-800/30 rounded-lg">
      <div className="space-y-4 w-full p-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-full min-h-[200px] w-full" />
      </div>
    </div>
  );
}

export interface LazyChartWrapperProps {
  children: ReactNode;
  height?: number | string;
}

export function LazyChartWrapper({ children, height = 300 }: LazyChartWrapperProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <div style={{ height: typeof height === "number" ? `${height}px` : height }}>
        {children}
      </div>
    </Suspense>
  );
}
