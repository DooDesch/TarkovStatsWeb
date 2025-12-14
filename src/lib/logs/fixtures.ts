/**
 * Sample fixtures for development and testing.
 * These provide minimal valid data structures for UI development without real logs.
 */

import type {
  Insights,
  ParsedLogResult,
  SessionTimeline,
  QuestInsight,
  Statistics,
} from "./types";

// ============================================================================
// Sample Session Timelines
// ============================================================================

export const sampleSessions: SessionTimeline[] = [
  {
    sessionId: "session-001",
    buildVersion: "0.15.5.1",
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    endedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    firstBackendAt: new Date(Date.now() - 3550000).toISOString(),
    firstConnectAt: new Date(Date.now() - 3500000).toISOString(),
    firstMatchEventAt: new Date(Date.now() - 3400000).toISOString(),
    startupDurationMs: 45000,
    matchmakingDurationMs: 120000,
  },
  {
    sessionId: "session-002",
    buildVersion: "0.15.5.1",
    startedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    endedAt: new Date(Date.now() - 82800000).toISOString(),
    firstBackendAt: new Date(Date.now() - 86350000).toISOString(),
    firstConnectAt: new Date(Date.now() - 86300000).toISOString(),
    startupDurationMs: 38000,
    matchmakingDurationMs: 95000,
  },
  {
    sessionId: "session-003",
    buildVersion: "0.15.4.0",
    startedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    endedAt: new Date(Date.now() - 169200000).toISOString(),
    firstErrorAt: new Date(Date.now() - 170000000).toISOString(),
    startupDurationMs: 52000,
    matchmakingDurationMs: 180000,
  },
];

// ============================================================================
// Sample Quests
// ============================================================================

export const sampleQuests: QuestInsight[] = [
  {
    id: "5936d90786f7742b1420ba5b",
    name: "Debut",
    traderId: "54cb50c76803fa8b248b4571",
    traderName: "Prapor",
    status: "completed",
    startedAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    completedAt: new Date(Date.now() - 518400000).toISOString(),
    relatedEvents: [],
  },
  {
    id: "5936da9e86f7742d65037edf",
    name: "Checking",
    traderId: "54cb50c76803fa8b248b4571",
    traderName: "Prapor",
    status: "started",
    startedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    relatedEvents: [],
  },
  {
    id: "5967530a86f77462ba22226b",
    name: "The Punisher - Part 1",
    traderId: "54cb50c76803fa8b248b4571",
    traderName: "Prapor",
    status: "started",
    startedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    relatedEvents: [],
  },
  {
    id: "59674cd986f7744ab26e32f2",
    name: "Delivery from the Past",
    traderId: "5935c25fb3acc3127c3d8cd9",
    traderName: "Peacekeeper",
    status: "failed",
    startedAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    failedAt: new Date(Date.now() - 345600000).toISOString(),
    relatedEvents: [],
  },
];

// ============================================================================
// Sample Insights
// ============================================================================

export const sampleInsights: Insights = {
  timelines: sampleSessions,
  quests: sampleQuests,
  matching: {
    sessions: [
      {
        sessionId: "session-001",
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        preparedAt: new Date(Date.now() - 3500000).toISOString(),
        runnedAt: new Date(Date.now() - 3480000).toISOString(),
        durationMs: 120000,
      },
      {
        sessionId: "session-002",
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        durationMs: 95000,
      },
      {
        sessionId: "session-003",
        startedAt: new Date(Date.now() - 172800000).toISOString(),
        durationMs: 180000,
      },
    ],
    averageDurationMs: 131666,
  },
  startup: {
    sessions: [
      {
        sessionId: "session-001",
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        firstBackendAt: new Date(Date.now() - 3555000).toISOString(),
        durationMs: 45000,
      },
      {
        sessionId: "session-002",
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        durationMs: 38000,
      },
      {
        sessionId: "session-003",
        startedAt: new Date(Date.now() - 172800000).toISOString(),
        durationMs: 52000,
      },
    ],
    averageDurationMs: 45000,
  },
  errors: {
    total: 42,
    byFamily: {
      null_reference: 15,
      key_not_found: 12,
      mip_timeout: 8,
      other: 7,
    },
    firstAt: new Date(Date.now() - 170000000).toISOString(),
  },
  inventory: {
    totalRejections: 23,
    byOperation: {
      Move: 12,
      Split: 6,
      Merge: 3,
      Fold: 2,
    },
    byCode: {
      "226": 10,
      "228": 8,
      "230": 5,
    },
  },
  connectivity: {
    totalConnections: 156,
    totalDisconnects: 12,
    totalTimeouts: 8,
    byAddress: {
      "185.128.24.12:17000": { connect: 45, disconnect: 3, timeout: 2 },
      "185.128.24.15:17000": { connect: 38, disconnect: 2, timeout: 1 },
      "185.128.24.18:17000": { connect: 32, disconnect: 4, timeout: 3 },
      "185.128.24.21:17000": { connect: 25, disconnect: 2, timeout: 1 },
      "185.128.24.24:17000": { connect: 16, disconnect: 1, timeout: 1 },
    },
  },
  items: {
    "5447a9cd4bdc2dbd208b4567": {
      id: "5447a9cd4bdc2dbd208b4567",
      name: "M4A1",
      kind: "item",
    },
    "5447ac644bdc2d6c208b4567": {
      id: "5447ac644bdc2d6c208b4567",
      name: "AK-74M",
      kind: "item",
    },
  },
  traders: {
    "54cb50c76803fa8b248b4571": {
      id: "54cb50c76803fa8b248b4571",
      name: "Prapor",
      kind: "trader",
    },
    "5935c25fb3acc3127c3d8cd9": {
      id: "5935c25fb3acc3127c3d8cd9",
      name: "Peacekeeper",
      kind: "trader",
    },
    "54cb57776803fa99248b456e": {
      id: "54cb57776803fa99248b456e",
      name: "Therapist",
      kind: "trader",
    },
    "5ac3b934156ae10c4430e83c": {
      id: "5ac3b934156ae10c4430e83c",
      name: "Ragman",
      kind: "trader",
    },
  },
};

// ============================================================================
// Sample Parsed Results
// ============================================================================

export const sampleParsedResults: ParsedLogResult[] = [
  {
    filePath: "log_2025.01.15_14-30-00/application.log",
    logType: "application",
    events: [],
    meta: {
      earliestTimestamp: new Date(Date.now() - 3600000).toISOString(),
      latestTimestamp: new Date(Date.now() - 1800000).toISOString(),
      buildVersion: "0.15.5.1",
      sessionPrefix: "log_2025.01.15_14-30-00",
    },
  },
  {
    filePath: "log_2025.01.15_14-30-00/backend.log",
    logType: "backend",
    events: [],
    meta: {
      earliestTimestamp: new Date(Date.now() - 3550000).toISOString(),
      latestTimestamp: new Date(Date.now() - 1850000).toISOString(),
      buildVersion: "0.15.5.1",
    },
  },
  {
    filePath: "log_2025.01.15_14-30-00/errors.log",
    logType: "errors",
    events: [],
    meta: {
      earliestTimestamp: new Date(Date.now() - 3400000).toISOString(),
      latestTimestamp: new Date(Date.now() - 2000000).toISOString(),
      buildVersion: "0.15.5.1",
    },
  },
  {
    filePath: "log_2025.01.15_14-30-00/inventory.log",
    logType: "inventory",
    events: [],
    meta: {
      earliestTimestamp: new Date(Date.now() - 3300000).toISOString(),
      latestTimestamp: new Date(Date.now() - 1900000).toISOString(),
    },
  },
  {
    filePath: "log_2025.01.15_14-30-00/network-connection.log",
    logType: "network-connection",
    events: [],
    meta: {
      earliestTimestamp: new Date(Date.now() - 3500000).toISOString(),
      latestTimestamp: new Date(Date.now() - 1850000).toISOString(),
    },
  },
];

// ============================================================================
// Empty State Fixtures
// ============================================================================

export const emptyInsights: Insights = {
  timelines: [],
  quests: [],
  matching: {
    sessions: [],
    averageDurationMs: undefined,
  },
  startup: {
    sessions: [],
    averageDurationMs: undefined,
  },
  errors: {
    total: 0,
    byFamily: {},
    firstAt: undefined,
  },
  inventory: {
    totalRejections: 0,
    byOperation: {},
    byCode: {},
  },
  connectivity: {
    totalConnections: 0,
    totalDisconnects: 0,
    totalTimeouts: 0,
    byAddress: {},
  },
  items: {},
  traders: {},
};

export const emptyParsedResults: ParsedLogResult[] = [];

// ============================================================================
// Sample Statistics
// ============================================================================

export const sampleStatistics: Statistics = {
  sessions: [
    {
      id: "session-001",
      buildVersion: "0.15.5.1",
      earliestTimestamp: new Date(Date.now() - 3600000).toISOString(),
      latestTimestamp: new Date(Date.now() - 1800000).toISOString(),
      logTypes: ["application", "backend", "errors", "inventory", "network-connection"],
      totals: { events: 1250, errors: 15, warnings: 42 },
    },
    {
      id: "session-002",
      buildVersion: "0.15.5.1",
      earliestTimestamp: new Date(Date.now() - 86400000).toISOString(),
      latestTimestamp: new Date(Date.now() - 82800000).toISOString(),
      logTypes: ["application", "backend", "network-connection"],
      totals: { events: 980, errors: 8, warnings: 27 },
    },
  ],
  backend: {
    totalRequests: 245,
    totalResponses: 240,
    totalErrors: 5,
    retries: 12,
    byStatusCode: { "200": 230, "500": 5, "503": 5 },
    byEndpoint: {
      "/client/game/start": 45,
      "/client/items": 38,
      "/client/trading/api/getTradersList": 32,
    },
  },
  cache: {
    hits: 156,
    misses: 89,
  },
  inventory: {
    totalRejections: 23,
    byOperation: { Move: 12, Split: 6, Merge: 3, Fold: 2 },
    byCode: { "226": 10, "228": 8, "230": 5 },
    items: { "5447a9cd4bdc2dbd208b4567": 5, "5447ac644bdc2d6c208b4567": 3 },
  },
  network: {
    connections: 156,
    disconnects: 12,
    timeouts: 8,
    byAddress: {
      "185.128.24.12:17000": { connect: 45, disconnect: 3, timeout: 2 },
      "185.128.24.15:17000": { connect: 38, disconnect: 2, timeout: 1 },
    },
    metrics: {
      samples: 450,
      rpiAvg: 42.5,
      ludAvg: 15.2,
      rttSamples: 120,
      rttAvg: 65.3,
      totalPacketsLost: 42,
      totalPacketsSent: 125000,
      totalPacketsReceived: 118000,
    },
  },
  push: {
    connections: 12,
    drops: 2,
    notifications: 89,
  },
  audio: {
    initSuccess: 3,
    occlusionErrors: 5,
  },
  errors: {
    totals: 42,
    byFamily: {
      null_reference: 15,
      key_not_found: 12,
      mip_timeout: 8,
      other: 7,
    },
  },
  matchmaking: {
    groupIds: ["group-001", "group-002"],
    events: [],
  },
  anticheat: {
    initLines: 24,
    errors: 0,
    lastStatus: "BattlEye initialized successfully",
  },
  quests: [
    {
      id: "5936d90786f7742b1420ba5b",
      name: "Debut",
      traderId: "54cb50c76803fa8b248b4571",
      traderName: "Prapor",
      status: "completed",
      relatedEvents: [],
      rewardRubles: 15000,
      rewardItems: { "5449016a4bdc2d6f028b456f": 2 },
    },
  ],
  traders: {
    "54cb50c76803fa8b248b4571": { id: "54cb50c76803fa8b248b4571", name: "Prapor", kind: "trader" },
    "5935c25fb3acc3127c3d8cd9": { id: "5935c25fb3acc3127c3d8cd9", name: "Peacekeeper", kind: "trader" },
  },
  items: {
    "5447a9cd4bdc2dbd208b4567": { id: "5447a9cd4bdc2dbd208b4567", name: "M4A1", kind: "item" },
    "5447ac644bdc2d6c208b4567": { id: "5447ac644bdc2d6c208b4567", name: "AK-74M", kind: "item" },
  },
};

export const emptyStatistics: Statistics = {
  sessions: [],
  backend: {
    totalRequests: 0,
    totalResponses: 0,
    totalErrors: 0,
    retries: 0,
    byStatusCode: {},
    byEndpoint: {},
  },
  cache: {
    hits: 0,
    misses: 0,
  },
  inventory: {
    totalRejections: 0,
    byOperation: {},
    byCode: {},
    items: {},
  },
  network: {
    connections: 0,
    disconnects: 0,
    timeouts: 0,
    byAddress: {},
    metrics: { samples: 0 },
  },
  push: {
    connections: 0,
    drops: 0,
    notifications: 0,
  },
  audio: {
    initSuccess: 0,
    occlusionErrors: 0,
  },
  errors: {
    totals: 0,
    byFamily: {},
  },
  matchmaking: {
    groupIds: [],
    events: [],
  },
  anticheat: {
    initLines: 0,
    errors: 0,
  },
  quests: [],
  traders: {},
  items: {},
};
