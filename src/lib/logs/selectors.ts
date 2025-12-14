/**
 * Selector functions for deriving computed data from parsed logs and insights.
 * These are pure functions that can be memoized for performance.
 */

import type {
  Insights,
  ParsedLogResult,
  SessionTimeline,
  QuestInsight,
  ErrorInsight,
  InventoryInsight,
  ConnectivityInsight,
  SessionFilter,
  ErrorFilter,
  QuestFilter,
  TimeBucket,
  ParsedFileInfo,
  AnyLogEvent,
} from "./types";

// ============================================================================
// Session Selectors
// ============================================================================

/**
 * Filter sessions by criteria
 */
export function filterSessions(
  sessions: SessionTimeline[],
  filter: SessionFilter
): SessionTimeline[] {
  return sessions.filter((session) => {
    // Date range filter
    if (filter.dateRange && session.startedAt) {
      const sessionDate = new Date(session.startedAt);
      if (
        sessionDate < filter.dateRange.start ||
        sessionDate > filter.dateRange.end
      ) {
        return false;
      }
    }

    // Build version filter
    if (filter.buildVersions?.length && session.buildVersion) {
      if (!filter.buildVersions.includes(session.buildVersion)) {
        return false;
      }
    }

    // Duration filters
    const duration =
      session.startedAt && session.endedAt
        ? new Date(session.endedAt).getTime() -
          new Date(session.startedAt).getTime()
        : null;

    if (
      filter.minDurationMs != null &&
      duration != null &&
      duration < filter.minDurationMs
    ) {
      return false;
    }
    if (
      filter.maxDurationMs != null &&
      duration != null &&
      duration > filter.maxDurationMs
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Sort sessions by start time (most recent first)
 */
export function sortSessionsByDate(
  sessions: SessionTimeline[],
  ascending = false
): SessionTimeline[] {
  return [...sessions].sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return ascending ? aTime - bTime : bTime - aTime;
  });
}

/**
 * Get unique build versions from sessions
 */
export function getUniqueBuildVersions(sessions: SessionTimeline[]): string[] {
  const versions = new Set<string>();
  sessions.forEach((s) => {
    if (s.buildVersion) versions.add(s.buildVersion);
  });
  return Array.from(versions).sort();
}

/**
 * Calculate session duration in ms
 */
export function getSessionDuration(session: SessionTimeline): number | null {
  if (!session.startedAt || !session.endedAt) return null;
  return (
    new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
  );
}

// ============================================================================
// Quest Selectors
// ============================================================================

/**
 * Resolve a quest's effective status using fallbacks.
 */
export function resolveQuestStatus(
  quest: QuestInsight
): QuestInsight["status"] {
  if (
    quest.status === "completed" ||
    quest.status === "failed" ||
    quest.status === "started"
  ) {
    return quest.status;
  }
  if (quest.completedAt) return "completed";
  if (quest.failedAt) return "failed";
  if (quest.relatedEvents?.length) return "started";
  return "unknown";
}

/**
 * Filter quests by criteria
 */
export function filterQuests(
  quests: QuestInsight[],
  filter: QuestFilter
): QuestInsight[] {
  return quests.filter((quest) => {
    const status = resolveQuestStatus(quest);

    // Status filter
    if (filter.status?.length && !filter.status.includes(status)) {
      return false;
    }

    // Trader filter
    if (
      filter.traderIds?.length &&
      quest.traderId &&
      !filter.traderIds.includes(quest.traderId)
    ) {
      return false;
    }

    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesName = quest.name?.toLowerCase().includes(query);
      const matchesId = quest.id.toLowerCase().includes(query);
      const matchesTrader = quest.traderName?.toLowerCase().includes(query);
      if (!matchesName && !matchesId && !matchesTrader) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get quest stats by status
 */
export function getQuestStats(quests: QuestInsight[]) {
  const statuses = quests.map((q) => resolveQuestStatus(q));
  return {
    total: quests.length,
    started: statuses.filter((s) => s === "started").length,
    completed: statuses.filter((s) => s === "completed").length,
    failed: statuses.filter((s) => s === "failed").length,
    unknown: statuses.filter((s) => s === "unknown").length,
  };
}

/**
 * Get unique trader IDs/names from quests
 */
export function getUniqueTraders(
  quests: QuestInsight[]
): Array<{ id: string; name?: string }> {
  const traders = new Map<string, string | undefined>();
  quests.forEach((q) => {
    if (q.traderId) {
      traders.set(q.traderId, q.traderName);
    }
  });
  return Array.from(traders.entries()).map(([id, name]) => ({ id, name }));
}

// ============================================================================
// Error Selectors
// ============================================================================

/**
 * Get top N error families by count
 */
export function getTopErrorFamilies(
  errors: ErrorInsight,
  topN = 10
): Array<{ family: string; count: number }> {
  return Object.entries(errors.byFamily)
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Get error percentage by family
 */
export function getErrorPercentages(
  errors: ErrorInsight
): Array<{ family: string; count: number; percentage: number }> {
  if (errors.total === 0) return [];

  return Object.entries(errors.byFamily)
    .map(([family, count]) => ({
      family,
      count,
      percentage: (count / errors.total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// Inventory Selectors
// ============================================================================

/**
 * Get top N inventory operations by rejection count
 */
export function getTopInventoryOperations(
  inventory: InventoryInsight,
  topN = 10
): Array<{ operation: string; count: number }> {
  return Object.entries(inventory.byOperation)
    .map(([operation, count]) => ({ operation, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Get top N inventory error codes
 */
export function getTopInventoryCodes(
  inventory: InventoryInsight,
  topN = 10
): Array<{ code: string; count: number }> {
  return Object.entries(inventory.byCode)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// ============================================================================
// Network Selectors
// ============================================================================

/**
 * Calculate connection success rate
 */
export function getConnectionSuccessRate(
  connectivity: ConnectivityInsight
): number {
  const total = connectivity.totalConnections + connectivity.totalTimeouts;
  if (total === 0) return 100;
  return (connectivity.totalConnections / total) * 100;
}

/**
 * Get top N addresses by activity
 */
export function getTopAddresses(
  connectivity: ConnectivityInsight,
  topN = 15
): Array<{
  address: string;
  connections: number;
  timeouts: number;
  rate: number;
}> {
  return Object.entries(connectivity.byAddress)
    .map(([address, stats]) => {
      const total = stats.connect + stats.timeout;
      return {
        address,
        connections: stats.connect,
        timeouts: stats.timeout,
        rate: total > 0 ? (stats.connect / total) * 100 : 100,
      };
    })
    .sort((a, b) => b.connections + b.timeouts - (a.connections + a.timeouts))
    .slice(0, topN);
}

// ============================================================================
// Matching/Startup Selectors
// ============================================================================

/**
 * Get matching time data for charts
 */
export function getMatchingTimeData(
  insights: Insights
): Array<{
  time: number;
  label: string;
  durationSec: number;
  sessionId: string;
}> {
  return insights.matching.sessions
    .filter((s) => s.durationMs != null && s.startedAt)
    .map((s) => ({
      time: new Date(s.startedAt!).getTime(),
      label: new Date(s.startedAt!).toLocaleDateString(),
      durationSec: s.durationMs! / 1000,
      sessionId: s.sessionId,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * Get startup time data for charts
 */
export function getStartupTimeData(
  insights: Insights
): Array<{
  time: number;
  label: string;
  durationSec: number;
  sessionId: string;
}> {
  return insights.startup.sessions
    .filter((s) => s.durationMs != null && s.startedAt)
    .map((s) => ({
      time: new Date(s.startedAt!).getTime(),
      label: new Date(s.startedAt!).toLocaleDateString(),
      durationSec: s.durationMs! / 1000,
      sessionId: s.sessionId,
    }))
    .sort((a, b) => a.time - b.time);
}

// ============================================================================
// Aggregation Helpers
// ============================================================================

/**
 * Bucket events by time interval
 */
export function bucketByTime(
  events: AnyLogEvent[],
  intervalMs: number,
  valueExtractor?: (event: AnyLogEvent) => number
): TimeBucket[] {
  if (events.length === 0) return [];

  // Sort by timestamp
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const buckets = new Map<number, { count: number; value: number }>();

  sorted.forEach((event) => {
    const time = new Date(event.timestamp).getTime();
    const bucketKey = Math.floor(time / intervalMs) * intervalMs;

    const existing = buckets.get(bucketKey) || { count: 0, value: 0 };
    existing.count++;
    if (valueExtractor) {
      existing.value += valueExtractor(event);
    }
    buckets.set(bucketKey, existing);
  });

  return Array.from(buckets.entries())
    .map(([timestamp, data]) => ({
      timestamp,
      label: new Date(timestamp).toLocaleString(),
      count: data.count,
      value: valueExtractor ? data.value : undefined,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Downsample data points to a maximum count using LTTB algorithm
 * (Largest Triangle Three Buckets) for better visual representation
 */
export function downsampleData<T extends { x: number; y: number }>(
  data: T[],
  maxPoints: number
): T[] {
  if (data.length <= maxPoints) return data;

  const result: T[] = [];
  const bucketSize = (data.length - 2) / (maxPoints - 2);

  // Always include first point
  result.push(data[0]);

  for (let i = 0; i < maxPoints - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = Math.min(avgRangeEnd, data.length) - avgRangeStart;

    // Calculate average point for next bucket
    let avgX = 0;
    let avgY = 0;
    for (let j = avgRangeStart; j < Math.min(avgRangeEnd, data.length); j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Find point in current bucket that creates largest triangle
    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

    let maxArea = -1;
    let maxAreaPoint = data[rangeStart];
    const prevPoint = result[result.length - 1];

    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (prevPoint.x - avgX) * (data[j].y - prevPoint.y) -
          (prevPoint.x - data[j].x) * (avgY - prevPoint.y)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[j];
      }
    }

    result.push(maxAreaPoint);
  }

  // Always include last point
  result.push(data[data.length - 1]);

  return result;
}

// ============================================================================
// File Info Selectors
// ============================================================================

/**
 * Extract file info from parsed results
 */
export function getFileInfoList(results: ParsedLogResult[]): ParsedFileInfo[] {
  return results.map((r) => ({
    fileName: r.filePath?.split(/[\\/]/).pop() ?? "unknown",
    logType: r.logType,
    eventCount: r.events.length,
    earliestTimestamp: r.meta.earliestTimestamp,
    latestTimestamp: r.meta.latestTimestamp,
    buildVersion: r.meta.buildVersion,
  }));
}

/**
 * Get total event count across all results
 */
export function getTotalEventCount(results: ParsedLogResult[]): number {
  return results.reduce((sum, r) => sum + r.events.length, 0);
}

/**
 * Get unique log types from results
 */
export function getUniqueLogTypes(results: ParsedLogResult[]): string[] {
  return Array.from(new Set(results.map((r) => r.logType)));
}

/**
 * Group results by log type
 */
export function groupResultsByLogType(
  results: ParsedLogResult[]
): Map<string, ParsedLogResult[]> {
  const grouped = new Map<string, ParsedLogResult[]>();
  results.forEach((r) => {
    const existing = grouped.get(r.logType) || [];
    existing.push(r);
    grouped.set(r.logType, existing);
  });
  return grouped;
}

/**
 * Get event count by log type
 */
export function getEventCountByLogType(
  results: ParsedLogResult[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  results.forEach((r) => {
    counts[r.logType] = (counts[r.logType] || 0) + r.events.length;
  });
  return counts;
}
