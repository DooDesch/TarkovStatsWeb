/**
 * Browser-safe statistics derivation from parsed log results.
 * Mirrors TarkovLogsAnalytics from tarkov-logs-lib but without Node.js dependencies.
 */

import type {
  ParsedLogResult,
  AnyLogEvent,
  Statistics,
  SessionSummary,
  BackendStats,
  CacheStats,
  InventoryStats,
  NetworkStats,
  PushStats,
  AudioStats,
  ErrorStats,
  MatchmakingStats,
  AntiCheatStats,
  QuestStat,
  ResolvedEntity,
  LogType,
} from "./types";

/**
 * Extract session prefix from file path (e.g. "log_2025.01.15_14-30-00")
 */
function extractSessionPrefix(filePath?: string): string | null {
  if (!filePath) return null;
  const match = filePath.match(/log_\d{4}\.\d{2}\.\d{2}_\d{2}-\d{2}-\d{2}[^/\\]*/);
  return match ? match[0] : null;
}

/**
 * Derive comprehensive statistics from parsed log results.
 * This is a browser-safe implementation that doesn't use any Node.js APIs.
 */
export function deriveStatistics(results: ParsedLogResult[]): Statistics {
  const sessions = buildSessions(results);
  const backend: BackendStats = {
    totalRequests: 0,
    totalResponses: 0,
    totalErrors: 0,
    retries: 0,
    byStatusCode: {},
    byEndpoint: {},
  };
  const cache: CacheStats = { hits: 0, misses: 0 };
  const inventory: InventoryStats = { totalRejections: 0, byOperation: {}, byCode: {}, items: {} };
  const network: NetworkStats = { connections: 0, disconnects: 0, timeouts: 0, byAddress: {}, metrics: { samples: 0 } };
  const push: PushStats = { connections: 0, drops: 0, notifications: 0 };
  const audio: AudioStats = { initSuccess: 0, occlusionErrors: 0 };
  const errors: ErrorStats = { totals: 0, byFamily: {} };
  const matchmaking: MatchmakingStats = { groupIds: [], events: [] };
  const anticheat: AntiCheatStats = { initLines: 0, errors: 0 };
  const quests: Record<string, QuestStat> = {};
  const traders: Record<string, ResolvedEntity> = {};
  const items: Record<string, ResolvedEntity> = {};

  for (const result of results) {
    for (const event of result.events) {
      accumulateBackend(event, backend);
      accumulateCache(event, cache);
      accumulateInventory(event, inventory, items);
      accumulateNetwork(event, network);
      accumulatePush(event, push);
      accumulateAudio(event, audio);
      accumulateErrors(event, errors);
      accumulateMatchmaking(event, matchmaking);
      accumulateAnticheat(event, anticheat);
      accumulateQuest(event, quests, traders);
    }
  }

  return {
    sessions,
    backend,
    cache,
    inventory,
    network,
    push,
    audio,
    errors,
    matchmaking,
    anticheat,
    quests: Object.values(quests),
    traders,
    items,
  };
}

function buildSessions(results: ParsedLogResult[]): SessionSummary[] {
  const sessionsMap = new Map<string, SessionSummary>();
  
  for (const res of results) {
    const sessionId = res.meta.sessionPrefix ?? extractSessionPrefix(res.filePath) ?? "unknown";
    const existing = sessionsMap.get(sessionId);
    const counts = countLevels(res.events);
    
    if (!existing) {
      sessionsMap.set(sessionId, {
        id: sessionId,
        buildVersion: res.meta.buildVersion,
        earliestTimestamp: res.meta.earliestTimestamp,
        latestTimestamp: res.meta.latestTimestamp,
        logTypes: [res.logType],
        totals: counts,
      });
    } else {
      existing.totals.events += counts.events;
      existing.totals.errors += counts.errors;
      existing.totals.warnings += counts.warnings;
      if (!existing.logTypes.includes(res.logType)) {
        existing.logTypes.push(res.logType);
      }
      if (res.meta.earliestTimestamp && (!existing.earliestTimestamp || res.meta.earliestTimestamp < existing.earliestTimestamp)) {
        existing.earliestTimestamp = res.meta.earliestTimestamp;
      }
      if (res.meta.latestTimestamp && (!existing.latestTimestamp || res.meta.latestTimestamp > existing.latestTimestamp)) {
        existing.latestTimestamp = res.meta.latestTimestamp;
      }
      if (!existing.buildVersion && res.meta.buildVersion) {
        existing.buildVersion = res.meta.buildVersion;
      }
    }
  }
  
  return Array.from(sessionsMap.values());
}

function countLevels(events: AnyLogEvent[]) {
  let errors = 0;
  let warnings = 0;
  for (const e of events) {
    if (e.level === "Error") errors += 1;
    if (e.level === "Warn" || e.level === "Warning") warnings += 1;
  }
  return { events: events.length, errors, warnings };
}

function accumulateBackend(event: AnyLogEvent, backend: BackendStats) {
  if (event.logType !== "backend") return;
  const fields = event.fields as Record<string, unknown> | undefined;
  const url = fields?.url as string | undefined;
  const code = fields?.responseCode as number | undefined;
  
  switch (event.eventFamily) {
    case "request":
      backend.totalRequests += 1;
      if (url) backend.byEndpoint[url] = (backend.byEndpoint[url] ?? 0) + 1;
      break;
    case "response":
      backend.totalResponses += 1;
      if (code) backend.byStatusCode[String(code)] = (backend.byStatusCode[String(code)] ?? 0) + 1;
      if (url) backend.byEndpoint[url] = (backend.byEndpoint[url] ?? 0) + 1;
      break;
    case "transport_error":
    case "server_exception":
      backend.totalErrors += 1;
      if (code) backend.byStatusCode[String(code)] = (backend.byStatusCode[String(code)] ?? 0) + 1;
      break;
    case "retry":
      backend.retries += 1;
      break;
  }
}

function accumulateCache(event: AnyLogEvent, cache: CacheStats) {
  if (event.logType !== "backendCache") return;
  const fields = event.fields as Record<string, unknown> | undefined;
  const hit = fields?.cacheHit;
  if (hit === false) cache.misses += 1;
  else cache.hits += 1;
}

function accumulateInventory(event: AnyLogEvent, inventory: InventoryStats, items: Record<string, ResolvedEntity>) {
  if (event.logType !== "inventory") return;
  inventory.totalRejections += 1;
  const fields = event.fields as Record<string, unknown> | undefined;
  const op = fields?.operationType as string | undefined;
  const code = fields?.code;
  const itemId = fields?.itemId as string | undefined;
  
  if (op) inventory.byOperation[op] = (inventory.byOperation[op] ?? 0) + 1;
  if (code !== undefined) inventory.byCode[String(code)] = (inventory.byCode[String(code)] ?? 0) + 1;
  if (itemId) {
    inventory.items[itemId] = (inventory.items[itemId] ?? 0) + 1;
    upsertResolved(items, itemId, "item");
  }
}

function accumulateNetwork(event: AnyLogEvent, network: NetworkStats) {
  if (event.logType === "network-connection") {
    const fields = event.fields as Record<string, unknown> | undefined;
    const addr = (fields?.address as string) ?? "unknown";
    const entry = (network.byAddress[addr] = network.byAddress[addr] ?? {
      connect: 0,
      disconnect: 0,
      timeout: 0,
    });
    
    switch (event.eventFamily) {
      case "connect":
      case "state_enter":
        network.connections += 1;
        entry.connect += 1;
        break;
      case "disconnect":
      case "send_disconnect":
        network.disconnects = (network.disconnects ?? 0) + 1;
        entry.disconnect += 1;
        break;
      case "timeout":
        network.timeouts += 1;
        entry.timeout += 1;
        break;
      case "statistics":
        // Accumulate connection quality statistics (rtt, packet loss)
        if (typeof fields?.rtt === "number") {
          network.metrics.rttSamples = (network.metrics.rttSamples ?? 0) + 1;
          const curRtt = network.metrics.rttAvg ?? 0;
          network.metrics.rttAvg = curRtt + (fields.rtt - curRtt) / network.metrics.rttSamples;
        }
        if (typeof fields?.packetsLost === "number") {
          network.metrics.totalPacketsLost = (network.metrics.totalPacketsLost ?? 0) + fields.packetsLost;
        }
        if (typeof fields?.packetsSent === "number") {
          network.metrics.totalPacketsSent = (network.metrics.totalPacketsSent ?? 0) + fields.packetsSent;
        }
        if (typeof fields?.packetsReceived === "number") {
          network.metrics.totalPacketsReceived = (network.metrics.totalPacketsReceived ?? 0) + fields.packetsReceived;
        }
        break;
    }
  }
  
  if (event.logType === "network-messages") {
    const fields = (event.fields as Record<string, unknown>) ?? {};
    network.metrics.samples += 1;
    
    // Running average for rpi and lud
    if (typeof fields.rpi === "number") {
      const cur = network.metrics.rpiAvg ?? 0;
      network.metrics.rpiAvg = cur + (fields.rpi - cur) / network.metrics.samples;
    }
    if (typeof fields.lud === "number") {
      const cur = network.metrics.ludAvg ?? 0;
      network.metrics.ludAvg = cur + (fields.lud - cur) / network.metrics.samples;
    }
  }
}

function accumulatePush(event: AnyLogEvent, push: PushStats) {
  if (event.logType !== "push-notifications") return;
  switch (event.eventFamily) {
    case "connection_params":
      push.connections += 1;
      break;
    case "dropped":
      push.drops += 1;
      break;
    case "notification":
    case "simple_notification":
      push.notifications += 1;
      break;
  }
}

function accumulateAudio(event: AnyLogEvent, audio: AudioStats) {
  if (event.logType !== "spatial-audio") return;
  if (event.eventFamily === "init_success") audio.initSuccess += 1;
  if (event.eventFamily === "occlusion_error") audio.occlusionErrors += 1;
}

function accumulateErrors(event: AnyLogEvent, errors: ErrorStats) {
  // Only count errors from the dedicated "errors" log to avoid double-counting
  if (event.logType !== "errors") return;
  errors.totals += 1;
  const family = event.eventFamily ?? "unknown";
  errors.byFamily[family] = (errors.byFamily[family] ?? 0) + 1;
}

function accumulateMatchmaking(event: AnyLogEvent, matchmaking: MatchmakingStats) {
  if (event.logType !== "application") return;
  if (event.eventFamily === "matchmaking") {
    matchmaking.events.push(event);
    const fields = event.fields as Record<string, unknown> | undefined;
    const groupId = fields?.groupId as string | undefined;
    if (groupId && !matchmaking.groupIds.includes(groupId)) {
      matchmaking.groupIds.push(groupId);
    }
  }
}

function accumulateAnticheat(event: AnyLogEvent, anticheat: AntiCheatStats) {
  if (event.logType !== "application") return;
  if (event.eventFamily === "anticheat") {
    anticheat.initLines += 1;
    anticheat.lastStatus = event.message;
  }
  if (event.eventFamily === "error" && event.message.toLowerCase().includes("battleye")) {
    anticheat.errors += 1;
  }
}

function accumulateQuest(
  event: AnyLogEvent,
  quests: Record<string, QuestStat>,
  traders: Record<string, ResolvedEntity>
) {
  const questId = findQuestId(event);
  if (!questId) return;
  
  if (!quests[questId]) {
    quests[questId] = {
      id: questId,
      status: "unknown",
      relatedEvents: [],
      traderId: undefined,
      traderName: undefined,
      rewardRubles: undefined,
      rewardItems: undefined,
    };
  }
  
  quests[questId].relatedEvents.push(event);
  
  const fields = event.fields as Record<string, unknown> | undefined;
  const questStatus =
    (fields?.questStatus as string)?.toLowerCase() ??
    (event.message ?? "").toLowerCase();

  if (questStatus.includes("completed") || questStatus === "success") {
    quests[questId].status = "completed";
  } else if (questStatus.includes("fail")) {
    quests[questId].status = "failed";
  } else if (questStatus.includes("start") || questStatus.includes("description")) {
    if (quests[questId].status === "unknown") quests[questId].status = "started";
  }

  // Aggregate rewards if present
  const rewardRub = fields?.questRewardRubles as number | undefined;
  if (typeof rewardRub === "number") {
    quests[questId].rewardRubles = (quests[questId].rewardRubles ?? 0) + rewardRub;
  }
  
  const rewardItemsCounts = fields?.questRewardItemsCounts as Record<string, number> | undefined;
  const rewardItems = fields?.questRewardItems as string[] | undefined;
  
  if (rewardItemsCounts || rewardItems) {
    quests[questId].rewardItems = quests[questId].rewardItems ?? {};
    if (rewardItemsCounts) {
      for (const [tpl, cnt] of Object.entries(rewardItemsCounts)) {
        quests[questId].rewardItems![tpl] = (quests[questId].rewardItems![tpl] ?? 0) + cnt;
      }
    }
    if (rewardItems) {
      for (const tpl of rewardItems) {
        quests[questId].rewardItems![tpl] = (quests[questId].rewardItems![tpl] ?? 0) + 1;
      }
    }
  }

  // Trader from quest fields
  const traderFromEvent = fields?.questTraderId as string | undefined;
  if (!quests[questId].traderId && traderFromEvent) {
    quests[questId].traderId = traderFromEvent;
    upsertResolved(traders, traderFromEvent, "trader");
  }
}

function findQuestId(event: AnyLogEvent): string | undefined {
  const msg = event.message ?? "";
  const match = msg.match(/\b([0-9a-f]{24})\b/i);
  if (match) return match[1];
  const fields = event.fields as Record<string, unknown> | undefined;
  if (fields?.questId) return fields.questId as string;
  return undefined;
}

function upsertResolved(target: Record<string, ResolvedEntity>, id: string, kind: ResolvedEntity["kind"]) {
  if (!target[id]) {
    target[id] = { id, kind };
  }
}





