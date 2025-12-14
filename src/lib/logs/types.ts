/**
 * Re-export and augment TarkovLogsLib types for TarkovStatsWeb.
 * Central place for all log-related type definitions.
 */

// Re-export core types from tarkov-logs-lib
export type {
  // Log Types
  LogType,
  AnyLogEvent,
  ParsedLogResult,
  LogParser,
  GameDataProvider,

  // Specific event types
  ApplicationLogEvent,
  BackendLogEvent,
  BackendCacheLogEvent,
  BackendQueueLogEvent,
  ErrorsLogEvent,
  FilesCheckerLogEvent,
  InsuranceLogEvent,
  InventoryLogEvent,
  NetworkConnectionLogEvent,
  NetworkMessagesLogEvent,
  ObjectPoolLogEvent,
  OutputLogEvent,
  PlayerLogEvent,
  PushNotificationsLogEvent,
  SeasonsLogEvent,
  SpatialAudioLogEvent,
  AiDataLogEvent,
  AiErrorsLogEvent,
} from "tarkov-logs-lib/browser";

// Re-export insight types
export type {
  Insights,
  SessionTimeline,
  QuestInsight,
  MatchingInsight,
  StartupInsight,
  ErrorInsight,
  InventoryInsight,
  ConnectivityInsight,
  InsightsOptions,
  ParsedInput,
} from "tarkov-logs-lib/browser";

// Additional type-only re-exports not exposed via the browser bundle
export type {
  NotificationMemberInfo,
  NotificationRaidSettings,
  NotificationPayload,
  LogLevel,
} from "tarkov-logs-lib";

// Re-export analytics types
export type {
  Statistics,
  QuestStat,
  MatchmakingStats,
  SessionSummary,
  ResolvedEntity,
  BackendStats,
  CacheStats,
  InventoryStats,
  NetworkStats,
  PushStats,
  AudioStats,
  ErrorStats,
  AntiCheatStats,
} from "tarkov-logs-lib/browser";

// ============================================================================
// App-specific derived types
// ============================================================================

/** Filter state for sessions/timelines */
export interface SessionFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  buildVersions?: string[];
  hasErrors?: boolean;
  minDurationMs?: number;
  maxDurationMs?: number;
}

/** Filter state for errors */
export interface ErrorFilter {
  families?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

/** Filter state for quests */
export interface QuestFilter {
  status?: ("started" | "completed" | "failed" | "unknown")[];
  traderIds?: string[];
  searchQuery?: string;
}

/** Filter state for network/connectivity */
export interface NetworkFilter {
  addresses?: string[];
  hasTimeouts?: boolean;
}

/** Aggregated time bucket for charts */
export interface TimeBucket {
  timestamp: number;
  label: string;
  count: number;
  value?: number;
}

/** Chart data point */
export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

/** Parsed file metadata for UI display */
export interface ParsedFileInfo {
  fileName: string;
  logType: string;
  eventCount: number;
  earliestTimestamp?: string;
  latestTimestamp?: string;
  buildVersion?: string;
  sizeBytes?: number;
}

/** Import progress state */
export interface ImportProgress {
  status: "idle" | "reading" | "parsing" | "computing" | "complete" | "error";
  currentFile?: string;
  filesProcessed: number;
  filesTotal: number;
  bytesProcessed: number;
  bytesTotal: number;
  errorMessage?: string;
}

/** Export format options */
export type ExportFormat = "json" | "csv";

/** Export scope options */
export type ExportScope =
  | "all"
  | "insights"
  | "sessions"
  | "errors"
  | "quests"
  | "network"
  | "inventory";
