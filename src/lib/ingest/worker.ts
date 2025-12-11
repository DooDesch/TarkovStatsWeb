/**
 * Web Worker for parsing log files off the main thread.
 * This prevents UI blocking when processing large log files.
 */

import { parseText, type ParsedLogResult } from "tarkov-logs-lib/browser";

export interface WorkerMessage {
  type: "parse";
  id: string;
  fileName: string;
  content: string;
}

export interface WorkerResponse {
  type: "result" | "error";
  id: string;
  result?: ParsedLogResult;
  error?: string;
}

// Worker context
const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, id, fileName, content } = event.data;

  if (type === "parse") {
    try {
      const result = parseText(fileName, content);
      const response: WorkerResponse = {
        type: "result",
        id,
        result,
      };
      ctx.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: "error",
        id,
        error: error instanceof Error ? error.message : "Unknown parsing error",
      };
      ctx.postMessage(response);
    }
  }
};

export {};
