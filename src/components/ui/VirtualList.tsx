"use client";

import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  containerClassName?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 40,
  overscan = 5,
  className,
  containerClassName,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={clsx("overflow-auto", containerClassName)}
    >
      <div
        className={className}
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface VirtualTableProps<T> {
  items: T[];
  columns: Array<{
    key: string;
    header: string;
    width?: string;
    align?: "left" | "center" | "right";
    render: (item: T) => ReactNode;
  }>;
  estimateRowSize?: number;
  maxHeight?: number;
  className?: string;
}

export function VirtualTable<T>({
  items,
  columns,
  estimateRowSize = 48,
  maxHeight = 500,
  className,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowSize,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div className={clsx("rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-10">
        <div className="flex">
          {columns.map((col) => (
            <div
              key={col.key}
              className={clsx(
                "px-4 py-3 text-sm font-medium text-zinc-400 flex-shrink-0",
                col.align === "right" && "text-right",
                col.align === "center" && "text-center"
              )}
              style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        ref={parentRef}
        style={{ maxHeight, overflow: "auto" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualRows.map((virtualRow) => {
            const item = items[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className="flex border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={clsx(
                      "px-4 py-3 text-sm flex items-center flex-shrink-0",
                      col.align === "right" && "justify-end",
                      col.align === "center" && "justify-center"
                    )}
                    style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
                  >
                    {col.render(item)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center text-zinc-500 py-12">
          No data available
        </div>
      )}
    </div>
  );
}
