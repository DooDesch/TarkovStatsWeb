"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./Card";

export interface ChartContainerProps {
  title: string;
  description?: string;
  action?: ReactNode;
  height?: number | string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export function ChartContainer({
  title,
  description,
  action,
  height = 320,
  children,
  className,
  loading = false,
}: ChartContainerProps) {
  return (
    <Card variant="glass" className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        <div
          style={{
            height: typeof height === "number" ? `${height}px` : height,
            minWidth: 0,
            minHeight: typeof height === "number" ? `${height}px` : undefined,
          }}
          className={clsx(
            "relative w-full",
            loading && "animate-pulse bg-zinc-800/50 rounded-lg"
          )}
        >
          {!loading && children}
        </div>
      </CardContent>
    </Card>
  );
}
