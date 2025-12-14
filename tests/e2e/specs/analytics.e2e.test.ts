/**
 * E2E test for analytics derivation and insights computation.
 * Uses fixture logs from TarkovLogsLib to verify end-to-end parsing and statistics.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { parseText, TarkovLogsInsights } from "tarkov-logs-lib/browser";
import { deriveStatistics } from "../../../src/lib/logs/analytics";
import type { ParsedLogResult } from "../../../src/lib/logs/types";

const FIXTURES_PATH = join(__dirname, "../../../../TarkovLogsLib/tests/fixtures/logs");

describe("TarkovStatsWeb Analytics E2E", () => {
  let parsedResults: ParsedLogResult[] = [];
  let fixtureSessionPath: string | null = null;

  beforeAll(() => {
    // Find a fixture session directory
    if (!existsSync(FIXTURES_PATH)) {
      console.warn(`Fixtures path not found: ${FIXTURES_PATH}`);
      return;
    }

    const sessionDirs = readdirSync(FIXTURES_PATH, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("log_"))
      .map((d) => d.name);

    if (sessionDirs.length === 0) {
      console.warn("No fixture session directories found");
      return;
    }

    // Use the first session directory
    fixtureSessionPath = join(FIXTURES_PATH, sessionDirs[0]);

    // Parse all log files in the session
    const logFiles = readdirSync(fixtureSessionPath).filter((f) => f.endsWith(".log"));

    for (const logFile of logFiles) {
      const filePath = join(fixtureSessionPath, logFile);
      const content = readFileSync(filePath, "utf-8");

      try {
        const result = parseText(logFile, content);
        parsedResults.push(result);
      } catch (error) {
        // Skip files that can't be parsed (unknown log types)
        console.warn(`Skipped parsing ${logFile}: ${error}`);
      }
    }
  });

  it("should parse fixture logs successfully", () => {
    expect(parsedResults.length).toBeGreaterThan(0);
    
    // Verify each result has expected structure
    for (const result of parsedResults) {
      expect(result.logType).toBeDefined();
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.meta).toBeDefined();
    }
  });

  it("should compute insights from parsed logs", async () => {
    if (parsedResults.length === 0) {
      console.warn("Skipping insights test - no parsed results");
      return;
    }

    const insightsEngine = new TarkovLogsInsights(parsedResults);
    const insights = await insightsEngine.compute();

    // Verify insights structure
    expect(insights).toBeDefined();
    expect(insights.timelines).toBeDefined();
    expect(Array.isArray(insights.timelines)).toBe(true);
    expect(insights.matching).toBeDefined();
    expect(insights.startup).toBeDefined();
    expect(insights.errors).toBeDefined();
    expect(insights.inventory).toBeDefined();
    expect(insights.connectivity).toBeDefined();
    expect(insights.quests).toBeDefined();
    expect(insights.items).toBeDefined();
    expect(insights.traders).toBeDefined();

    // Verify at least one session timeline was created
    if (parsedResults.some((r) => r.events.length > 0)) {
      expect(insights.timelines.length).toBeGreaterThan(0);
    }
  });

  it("should derive statistics from parsed logs", () => {
    if (parsedResults.length === 0) {
      console.warn("Skipping statistics test - no parsed results");
      return;
    }

    const statistics = deriveStatistics(parsedResults);

    // Verify statistics structure
    expect(statistics).toBeDefined();
    expect(statistics.sessions).toBeDefined();
    expect(Array.isArray(statistics.sessions)).toBe(true);
    expect(statistics.backend).toBeDefined();
    expect(statistics.cache).toBeDefined();
    expect(statistics.inventory).toBeDefined();
    expect(statistics.network).toBeDefined();
    expect(statistics.push).toBeDefined();
    expect(statistics.audio).toBeDefined();
    expect(statistics.errors).toBeDefined();
    expect(statistics.matchmaking).toBeDefined();
    expect(statistics.anticheat).toBeDefined();
    expect(statistics.quests).toBeDefined();
    expect(statistics.traders).toBeDefined();
    expect(statistics.items).toBeDefined();

    // Verify backend stats structure
    expect(statistics.backend.totalRequests).toBeGreaterThanOrEqual(0);
    expect(statistics.backend.totalResponses).toBeGreaterThanOrEqual(0);
    expect(statistics.backend.totalErrors).toBeGreaterThanOrEqual(0);
    expect(statistics.backend.retries).toBeGreaterThanOrEqual(0);
    expect(statistics.backend.byStatusCode).toBeDefined();
    expect(statistics.backend.byEndpoint).toBeDefined();

    // Verify network stats structure
    expect(statistics.network.connections).toBeGreaterThanOrEqual(0);
    expect(statistics.network.timeouts).toBeGreaterThanOrEqual(0);
    expect(statistics.network.metrics).toBeDefined();
    expect(statistics.network.metrics.samples).toBeGreaterThanOrEqual(0);

    // Verify at least one session was created
    if (parsedResults.some((r) => r.events.length > 0)) {
      expect(statistics.sessions.length).toBeGreaterThan(0);
    }
  });

  it("should have consistent session count between insights and statistics", async () => {
    if (parsedResults.length === 0) {
      console.warn("Skipping consistency test - no parsed results");
      return;
    }

    const insightsEngine = new TarkovLogsInsights(parsedResults);
    const insights = await insightsEngine.compute();
    const statistics = deriveStatistics(parsedResults);

    // Session counts should match
    expect(insights.timelines.length).toBe(statistics.sessions.length);
  });

  it("should correctly count errors from errors log only", () => {
    if (parsedResults.length === 0) {
      console.warn("Skipping error count test - no parsed results");
      return;
    }

    const statistics = deriveStatistics(parsedResults);
    const errorsLog = parsedResults.find((r) => r.logType === "errors");

    if (errorsLog) {
      // Error count should match the number of events in errors log
      expect(statistics.errors.totals).toBe(errorsLog.events.length);
    }
  });

  it("should accumulate backend request/response counts", () => {
    if (parsedResults.length === 0) {
      console.warn("Skipping backend count test - no parsed results");
      return;
    }

    const statistics = deriveStatistics(parsedResults);
    const backendLog = parsedResults.find((r) => r.logType === "backend");

    if (backendLog && backendLog.events.length > 0) {
      // Should have some backend activity
      const totalActivity =
        statistics.backend.totalRequests +
        statistics.backend.totalResponses +
        statistics.backend.totalErrors;
      expect(totalActivity).toBeGreaterThan(0);
    }
  });
});





