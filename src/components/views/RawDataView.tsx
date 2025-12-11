"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, Copy, Download, Search } from "lucide-react";
import { Button, VirtualizedJsonViewer } from "@/components/ui";
import type { Insights, ParsedLogResult } from "@/lib/logs/types";

export interface RawDataViewProps {
  insights: Insights;
  parsedResults: ParsedLogResult[];
}

type ViewMode = "insights" | "parsed" | "events";

export function RawDataView({ insights, parsedResults }: RawDataViewProps) {
  const [mode, setMode] = useState<ViewMode>("insights");
  const [selectedLog, setSelectedLog] = useState<number>(0);
  const [search, setSearch] = useState("");

  const data = useMemo(() => {
    switch (mode) {
      case "insights":
        return insights;
      case "parsed":
        return parsedResults;
      case "events":
        return parsedResults[selectedLog]?.events ?? [];
    }
  }, [mode, insights, parsedResults, selectedLog]);

  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const filteredJson = useMemo(() => {
    if (!search) return jsonString;
    return jsonString
      .split("\n")
      .filter((line) => line.toLowerCase().includes(search.toLowerCase()))
      .join("\n");
  }, [jsonString, search]);

  const stats = useMemo(() => ({
    lines: filteredJson.split("\n").length,
    size: (jsonString.length / 1024).toFixed(1),
    events: mode === "events" ? parsedResults[selectedLog]?.events.length : undefined,
  }), [filteredJson, jsonString, mode, parsedResults, selectedLog]);

  const downloadJson = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tarkov-${mode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-semibold text-zinc-100">Raw Data</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Copy} onClick={copyToClipboard}>
            Copy
          </Button>
          <Button variant="primary" size="sm" icon={Download} onClick={downloadJson}>
            Download JSON
          </Button>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "insights", label: "Insights" },
            { id: "parsed", label: "All Parsed Results" },
            { id: "events", label: "Events by Log" },
          ] as const
        ).map((m) => (
          <Button
            key={m.id}
            variant={mode === m.id ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {/* Log Selector for Events mode */}
      {mode === "events" && parsedResults.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm text-zinc-400">Select Log:</label>
          <select
            value={selectedLog}
            onChange={(e) => setSelectedLog(Number(e.target.value))}
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            {parsedResults.map((r, idx) => (
              <option key={idx} value={idx}>
                {r.filePath?.split(/[\\/]/).pop() ?? `Log ${idx + 1}`} ({r.events.length} events)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Filter JSON lines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-zinc-500">
        <span>Lines: {stats.lines.toLocaleString()}</span>
        <span>Size: {stats.size} KB</span>
        {stats.events !== undefined && (
          <span>Events: {stats.events.toLocaleString()}</span>
        )}
      </div>

      {/* JSON Viewer - Virtualized for performance */}
      <VirtualizedJsonViewer json={filteredJson || "No matching content"} maxHeight={600} />
    </div>
  );
}
