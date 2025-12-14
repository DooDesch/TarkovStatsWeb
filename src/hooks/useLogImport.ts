/**
 * React hook for importing and parsing log files.
 * Provides a unified API for file selection, parsing, and progress tracking.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  ParsedLogResult,
  Insights,
  Statistics,
  ImportProgress,
} from "@/lib/logs/types";
import {
  TarkovLogsInsights,
  type GameDataProvider,
} from "tarkov-logs-lib/browser";
import { deriveStatistics } from "@/lib/logs/analytics";
import {
  readFilesWithProgress,
  collectFilesFromDirectory,
  filterLogFiles,
  sortFilesByPath,
  getTotalFileSize,
  type FileReadProgress,
} from "@/lib/ingest/fileReader";
import {
  getWorkerPool,
  terminateWorkerPool,
  type ParseResult,
} from "@/lib/ingest/parseWorkerPool";

export interface UseLogImportReturn {
  // State
  progress: ImportProgress;
  parsedResults: ParsedLogResult[];
  insights: Insights | null;
  statistics: Statistics | null;

  // Actions
  importFiles: (files: File[]) => Promise<void>;
  importFromDirectory: () => Promise<void>;
  importFromFileInput: () => void;
  reset: () => void;

  // Dropzone helpers
  onDrop: (acceptedFiles: File[]) => void;

  // Computed
  isLoading: boolean;
  hasData: boolean;
  errorMessage: string | null;
}

export type GameDataSource = "none" | "tarkovDev" | "tarkovTracker";

const initialProgress: ImportProgress = {
  status: "idle",
  filesProcessed: 0,
  filesTotal: 0,
  bytesProcessed: 0,
  bytesTotal: 0,
};

type QuestCacheEntry = {
  name?: string;
  traderId?: string;
  traderName?: string;
};

type TraderCacheEntry = {
  id: string;
  name?: string;
  nickname?: string;
};

type ItemCacheEntry = {
  id: string;
  name?: string;
  shortName?: string;
};

type LocationCacheEntry = {
  id: string;
  name?: string;
};

// Track latest gameDataSource to avoid stale closures
const gameDataSourceRef: { current?: GameDataSource } = { current: "none" };

function resolveGameDataProviders(
  source: GameDataSource | undefined
): GameDataProvider[] {
  const effectiveSource = source ?? gameDataSourceRef.current ?? "none";
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "useLogImport:resolveGameDataProviders",
      message: "providers selection",
      data: {
        source,
        effectiveSource,
        refSource: gameDataSourceRef.current,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (effectiveSource === "tarkovDev" || effectiveSource === "tarkovTracker") {
    // Bulk tracker-only provider (4 fetches max), avoids per-UUID lookups
    return [new BulkTrackerProvider()];
  }
  return [];
}

async function enrichInsights(
  insights: Insights,
  providers: GameDataProvider[],
  questCache: React.MutableRefObject<Record<string, QuestCacheEntry>>,
  traderCache: React.MutableRefObject<Record<string, TraderCacheEntry>>
): Promise<Insights> {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "useLogImport:enrichInsights:start",
      message: "start enrich",
      data: { quests: insights.quests.length, providers: providers.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const firstAvailable = async <T>(
    fn: (p: GameDataProvider) => Promise<T | null | undefined>
  ) => {
    for (const p of providers) {
      try {
        const res = await fn(p);
        if (res) return res;
      } catch (error) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "debug-session",
              runId: "pre-fix",
              hypothesisId: "H1",
              location: "useLogImport:enrichInsights:firstAvailable",
              message: "provider error",
              data: { error: (error as Error)?.message },
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
        // #endregion
        // ignore and try next
      }
    }
    return null;
  };

  const quests = await Promise.all(
    insights.quests.map(async (quest, idx) => {
      const cached = questCache.current[quest.id];
      if (cached) {
        // #region agent log
        if (idx < 15) {
          fetch(
            "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: "debug-session",
                runId: "pre-fix",
                hypothesisId: "H2",
                location: "useLogImport:enrichInsights:quest",
                message: "cache hit",
                data: { questId: quest.id },
                timestamp: Date.now(),
              }),
            }
          ).catch(() => {});
        }
        // #endregion
        return {
          ...quest,
          name: quest.name ?? cached.name,
          traderId: quest.traderId ?? cached.traderId,
          traderName: quest.traderName ?? cached.traderName,
        };
      }

      const resolved = await firstAvailable((p) => p.getQuestById(quest.id));
      if (!resolved) {
        // #region agent log
        if (idx < 15) {
          fetch(
            "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: "debug-session",
                runId: "pre-fix",
                hypothesisId: "H1",
                location: "useLogImport:enrichInsights:quest",
                message: "provider resolved null",
                data: { questId: quest.id },
                timestamp: Date.now(),
              }),
            }
          ).catch(() => {});
        }
        // #endregion
        return quest;
      }

      questCache.current[quest.id] = {
        name: resolved.name,
        traderId: resolved.traderId,
      };

      // #region agent log
      if (idx < 15) {
        fetch(
          "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "debug-session",
              runId: "pre-fix",
              hypothesisId: "H1",
              location: "useLogImport:enrichInsights:quest",
              message: "provider resolved",
              data: {
                questId: quest.id,
                name: resolved.name,
                traderId: resolved.traderId,
              },
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
      }
      // #endregion

      return {
        ...quest,
        name: quest.name ?? resolved.name,
        traderId: quest.traderId ?? resolved.traderId,
        traderName: quest.traderName ?? resolved.name,
      };
    })
  );

  const traderIds = new Set<string>();
  for (const quest of quests) {
    if (quest.traderId) traderIds.add(quest.traderId);
  }

  const traders = { ...insights.traders };
  for (const id of traderIds) {
    if (traders[id]) continue;

    const cached = traderCache.current[id];
    if (cached) {
      traders[id] = {
        kind: "trader",
        id: cached.id,
        name: cached.name ?? cached.nickname,
      };
      continue;
    }

    const resolved = await firstAvailable((p) => p.getTraderById(id));
    if (resolved) {
      traderCache.current[id] = {
        id: resolved.id,
        name: resolved.name,
        nickname: resolved.nickname,
      };
      traders[id] = {
        kind: "trader",
        id: resolved.id,
        name: resolved.name ?? resolved.nickname,
      };
    }
  }

  return { ...insights, quests, traders };
}

// Summarize unknown quests after enrichment (first run only few)
function logUnknownQuestsSummary(insights: Insights) {
  const unknown = insights.quests.filter((q) => !q.name);
  fetch("http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix",
      hypothesisId: "H2",
      location: "useLogImport:enrichInsights:summary",
      message: "unknown quests summary",
      data: {
        total: insights.quests.length,
        unknownCount: unknown.length,
        sample: unknown.slice(0, 10).map((q) => q.id),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

class BulkTrackerProvider implements GameDataProvider {
  private readonly baseUrl =
    "https://raw.githubusercontent.com/TarkovTracker/tarkovdata/master";

  private loaded?: Promise<void>;
  private items?: Record<string, any>;
  private quests?: Record<string, any>;
  private traders?: Record<string, any>;
  private locations?: Record<string, any>;

  async getItemById(id: string) {
    await this.ensureLoaded();
    const match = this.items?.[id];
    if (!match) return null;
    return {
      id: match.id,
      name: match.name,
      shortName: match.shortName,
      basePrice: match.basePrice,
      categoryNames: match.types,
    };
  }

  async getQuestById(id: string) {
    await this.ensureLoaded();
    const match = this.quests?.[id];
    if (!match) return null;
    return {
      id: match.id,
      name: match.name,
      traderId: match.traderId,
      experience: match.experience,
    };
  }

  async getTraderById(id: string) {
    await this.ensureLoaded();
    const match = this.traders?.[id];
    if (!match) return null;
    return { id: match.id, name: match.name, nickname: match.nickname };
  }

  async getLocationById(id: string) {
    await this.ensureLoaded();
    const match = this.locations?.[id];
    if (!match) return null;
    return { id: match.id, name: match.name, type: match.type };
  }

  private async ensureLoaded() {
    if (this.items && this.quests && this.traders && this.locations) return;
    if (this.loaded) return this.loaded;
    this.loaded = this.loadAll();
    await this.loaded;
  }

  private async loadAll() {
    try {
      const [items, quests, traders, locations] = await Promise.all([
        this.fetchJson<any[]>("items.json"),
        this.fetchJson<any[]>("quests.json"),
        this.fetchJson<any[]>("traders.json"),
        this.fetchJson<any[]>("maps.json"),
      ]);

      this.items = Object.fromEntries(items.map((i) => [i.id, i]));
      this.quests = Object.fromEntries(quests.map((q) => [q.id, q]));
      this.traders = Object.fromEntries(traders.map((t) => [t.id, t]));
      this.locations = Object.fromEntries(locations.map((l) => [l.id, l]));

      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H5",
            location: "BulkTrackerProvider:loadAll",
            message: "load success",
            data: {
              items: items.length,
              quests: quests.length,
              traders: traders.length,
              locations: locations.length,
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "debug-session",
            runId: "pre-fix",
            hypothesisId: "H5",
            location: "BulkTrackerProvider:loadAll",
            message: "load failed",
            data: { error: (error as Error)?.message },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      throw error;
    }
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}/${path}`;
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`TarkovTracker bulk fetch failed: ${res.statusText}`);
    return (await res.json()) as T;
  }
}

async function enrichStatistics(
  statistics: Statistics,
  providers: GameDataProvider[],
  itemCache: React.MutableRefObject<Record<string, ItemCacheEntry>>,
  traderCache: React.MutableRefObject<Record<string, TraderCacheEntry>>,
  locationCache: React.MutableRefObject<Record<string, LocationCacheEntry>>
): Promise<Statistics> {
  const firstAvailable = async <T>(
    fn: (p: GameDataProvider) => Promise<T | null | undefined>
  ) => {
    for (const p of providers) {
      try {
        const res = await fn(p);
        if (res) return res;
      } catch {
        // ignore and try next
      }
    }
    return null;
  };

  const items = { ...statistics.items };
  for (const id of Object.keys(items)) {
    const cached = itemCache.current[id];
    if (cached) {
      items[id] = { id, kind: "item", name: cached.name ?? cached.shortName };
      continue;
    }
    const resolved = await firstAvailable((p) => p.getItemById(id));
    if (resolved) {
      itemCache.current[id] = {
        id: resolved.id,
        name: resolved.name,
        shortName: resolved.shortName,
      };
      items[id] = {
        id: resolved.id,
        kind: "item",
        name: resolved.name ?? resolved.shortName,
      };
    }
  }

  const traders = { ...statistics.traders };
  for (const id of Object.keys(traders)) {
    const cached = traderCache.current[id];
    if (cached) {
      traders[id] = {
        id: cached.id,
        kind: "trader",
        name: cached.name ?? cached.nickname,
      };
      continue;
    }
    const resolved = await firstAvailable((p) => p.getTraderById(id));
    if (resolved) {
      traderCache.current[id] = {
        id: resolved.id,
        name: resolved.name,
        nickname: resolved.nickname,
      };
      traders[id] = {
        id: resolved.id,
        kind: "trader",
        name: resolved.name ?? resolved.nickname,
      };
    }
  }

  // Locations: not currently populated in statistics; placeholder for future map enrichment
  locationCache.current = locationCache.current;

  return { ...statistics, items, traders };
}

export function useLogImport(
  gameDataSource: GameDataSource
): UseLogImportReturn {
  const [progress, setProgress] = useState<ImportProgress>(initialProgress);
  const [parsedResults, setParsedResults] = useState<ParsedLogResult[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const questCacheRef = useRef<Record<string, QuestCacheEntry>>({});
  const traderCacheRef = useRef<Record<string, TraderCacheEntry>>({});
  const itemCacheRef = useRef<Record<string, ItemCacheEntry>>({});
  const locationCacheRef = useRef<Record<string, LocationCacheEntry>>({});
  // Cleanup worker pool on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [gameDataSource]);

  const reset = useCallback(() => {
    setProgress(initialProgress);
    setParsedResults([]);
    setInsights(null);
    setStatistics(null);
    setErrorMessage(null);
  }, [gameDataSource]);

  useEffect(() => {
    gameDataSourceRef.current = gameDataSource ?? "none";
    questCacheRef.current = {};
    traderCacheRef.current = {};
    itemCacheRef.current = {};
    locationCacheRef.current = {};
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "useLogImport:cacheReset",
        message: "provider changed, caches cleared",
        data: { source: gameDataSource },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [gameDataSource]);

  const importFiles = useCallback(async (files: File[]) => {
    // #region agent log
    const effectiveSource =
      gameDataSourceRef.current ?? gameDataSource ?? "none";
    fetch("http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "pre-fix",
        hypothesisId: "H3",
        location: "useLogImport:importFiles:start",
        message: "import start",
        data: {
          source: gameDataSource,
          effectiveSource,
          refSource: gameDataSourceRef.current,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    // Filter to only .log files
    const logFiles = filterLogFiles(files);

    if (logFiles.length === 0) {
      setErrorMessage("No .log files found in the selection");
      return;
    }

    // Sort for consistent session grouping
    const sortedFiles = sortFilesByPath(logFiles);
    const totalBytes = getTotalFileSize(sortedFiles);

    setErrorMessage(null);
    setProgress({
      status: "reading",
      filesProcessed: 0,
      filesTotal: sortedFiles.length,
      bytesProcessed: 0,
      bytesTotal: totalBytes,
    });

    try {
      // Phase 1: Read files
      const fileContents = await readFilesWithProgress(
        sortedFiles,
        (readProgress: FileReadProgress) => {
          setProgress((prev) => ({
            ...prev,
            status: "reading",
            currentFile: readProgress.currentFile,
            filesProcessed: readProgress.filesRead,
            bytesProcessed: readProgress.bytesRead,
          }));
        }
      );

      // Phase 2: Parse files using worker pool
      setProgress((prev) => ({
        ...prev,
        status: "parsing",
        filesProcessed: 0,
      }));

      const workerPool = getWorkerPool();
      const tasks = fileContents.map((fc, idx) => ({
        id: `file-${idx}`,
        fileName: fc.fileName,
        content: fc.content,
      }));

      const results: ParsedLogResult[] = [];
      const parseResults = await workerPool.parseAll(
        tasks,
        (completed, total, latest) => {
          setProgress((prev) => ({
            ...prev,
            status: "parsing",
            filesProcessed: completed,
            currentFile: latest.result?.filePath,
          }));

          if (latest.success && latest.result) {
            results.push(latest.result);
          }
        }
      );

      // Collect successful results
      const successfulResults = parseResults
        .filter(
          (r): r is ParseResult & { result: ParsedLogResult } =>
            r.success && !!r.result
        )
        .map((r) => r.result);

      setParsedResults(successfulResults);

      // Phase 3: Compute insights and statistics
      if (successfulResults.length > 0) {
        setProgress((prev) => ({
          ...prev,
          status: "computing",
        }));

        // Compute insights
        const providers = resolveGameDataProviders(effectiveSource);
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "debug-session",
              runId: "pre-fix",
              hypothesisId: "H3",
              location: "useLogImport:compute:providers",
              message: "provider count",
              data: { providers: providers.length },
              timestamp: Date.now(),
            }),
          }
        ).catch(() => {});
        // #endregion
        const insightsEngine = new TarkovLogsInsights(successfulResults);
        let computedInsights = await insightsEngine.compute();

        if (providers.length > 0) {
          computedInsights = await enrichInsights(
            computedInsights,
            providers,
            questCacheRef,
            traderCacheRef
          );
          logUnknownQuestsSummary(computedInsights);
        } else {
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: "debug-session",
                runId: "pre-fix",
                hypothesisId: "H1",
                location: "useLogImport:compute:providers",
                message: "no providers -> no enrichment",
                data: {},
                timestamp: Date.now(),
              }),
            }
          ).catch(() => {});
          // #endregion
        }

        setInsights(computedInsights);

        // Compute statistics (browser-safe derivation)
        let computedStatistics = deriveStatistics(successfulResults);
        if (providers.length > 0) {
          computedStatistics = await enrichStatistics(
            computedStatistics,
            providers,
            itemCacheRef,
            traderCacheRef,
            locationCacheRef
          );
        }
        setStatistics(computedStatistics);
      }

      setProgress((prev) => ({
        ...prev,
        status: "complete",
      }));
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown import error"
      );
      setProgress((prev) => ({
        ...prev,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  const importFromDirectory = useCallback(async () => {
    // Check for File System Access API support
    if (!("showDirectoryPicker" in window)) {
      // Fallback to legacy input
      importFromFileInputLegacy(true);
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const files = await collectFilesFromDirectory(dirHandle);

      if (files.length === 0) {
        setErrorMessage("No .log files found in the selected folder");
        return;
      }

      await importFiles(files);
    } catch (error) {
      // User likely cancelled the picker
      if ((error as Error).name !== "AbortError") {
        console.error("Directory selection error:", error);
        // Fallback to legacy input on error
        importFromFileInputLegacy(true);
      }
    }
  }, [importFiles]);

  const importFromFileInputLegacy = useCallback(
    (directory: boolean) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = ".log";

      if (directory) {
        (input as any).webkitdirectory = true;
      }

      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length > 0) {
          importFiles(files);
        }
      };

      input.click();
    },
    [importFiles]
  );

  const importFromFileInput = useCallback(() => {
    importFromFileInputLegacy(false);
  }, [importFromFileInputLegacy]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        importFiles(acceptedFiles);
      }
    },
    [importFiles]
  );

  return {
    // State
    progress,
    parsedResults,
    insights,
    statistics,

    // Actions
    importFiles,
    importFromDirectory,
    importFromFileInput,
    reset,

    // Dropzone helpers
    onDrop,

    // Computed
    isLoading:
      progress.status !== "idle" &&
      progress.status !== "complete" &&
      progress.status !== "error",
    hasData: parsedResults.length > 0,
    errorMessage,
  };
}

export default useLogImport;
