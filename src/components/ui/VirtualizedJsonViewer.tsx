"use client";

import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";

export interface VirtualizedJsonViewerProps {
  json: string;
  maxHeight?: number;
  className?: string;
}

export function VirtualizedJsonViewer({
  json,
  maxHeight = 600,
  className,
}: VirtualizedJsonViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => json.split("\n"), [json]);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Syntax highlighting helper
  const highlightLine = (line: string) => {
    // Key
    const keyMatch = line.match(/^(\s*)("[^"]+"):/);
    if (keyMatch) {
      const indent = keyMatch[1];
      const key = keyMatch[2];
      const rest = line.slice(keyMatch[0].length);
      return (
        <>
          <span>{indent}</span>
          <span className="text-purple-400">{key}</span>
          <span className="text-zinc-500">:</span>
          {highlightValue(rest)}
        </>
      );
    }

    // Array/object values
    return highlightValue(line);
  };

  const highlightValue = (value: string) => {
    // String value
    if (value.match(/^\s*".*"[,]?$/)) {
      return <span className="text-emerald-400">{value}</span>;
    }
    // Number
    if (value.match(/^\s*-?[\d.]+[,]?$/)) {
      return <span className="text-amber-400">{value}</span>;
    }
    // Boolean/null
    if (value.match(/^\s*(true|false|null)[,]?$/)) {
      return <span className="text-blue-400">{value}</span>;
    }
    // Brackets
    if (value.match(/^\s*[\[\]{}][,]?$/)) {
      return <span className="text-zinc-500">{value}</span>;
    }
    return <span className="text-zinc-300">{value}</span>;
  };

  return (
    <div
      className={clsx(
        "rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden",
        className
      )}
    >
      <div
        ref={parentRef}
        className="overflow-auto font-mono text-sm"
        style={{ maxHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const line = lines[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className="flex items-center"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span className="w-12 flex-shrink-0 text-right pr-4 text-zinc-600 select-none">
                  {virtualRow.index + 1}
                </span>
                <span className="flex-1 whitespace-pre overflow-hidden text-ellipsis pr-4">
                  {highlightLine(line)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-500 flex gap-4">
        <span>{lines.length.toLocaleString()} lines</span>
        <span>{(json.length / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}
