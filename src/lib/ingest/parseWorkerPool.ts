/**
 * Worker pool for parallel log file parsing.
 * Manages a pool of web workers to parse files concurrently.
 */

import type { ParsedLogResult } from "../logs/types";

export interface ParseTask {
  id: string;
  fileName: string;
  content: string;
}

export interface ParseResult {
  id: string;
  success: boolean;
  result?: ParsedLogResult;
  error?: string;
}

interface PendingTask {
  task: ParseTask;
  resolve: (result: ParseResult) => void;
}

/**
 * Creates and manages a pool of web workers for parsing.
 */
export class ParseWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private pendingTasks: PendingTask[] = [];
  private taskMap = new Map<string, PendingTask>();
  private isTerminated = false;

  constructor(private poolSize: number = navigator.hardwareConcurrency || 4) {
    this.initWorkers();
  }

  private initWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(
        new URL("./worker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (event) => {
        const { type, id, result, error } = event.data;
        const pending = this.taskMap.get(id);

        if (pending) {
          this.taskMap.delete(id);

          if (type === "result") {
            pending.resolve({ id, success: true, result });
          } else {
            pending.resolve({ id, success: false, error });
          }
        }

        // Return worker to available pool and process next task
        this.availableWorkers.push(worker);
        this.processNextTask();
      };

      worker.onerror = (event) => {
        console.error("Worker error:", event);
        // Return worker to pool even on error
        this.availableWorkers.push(worker);
        this.processNextTask();
      };

      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  private processNextTask() {
    if (this.isTerminated) return;
    if (this.pendingTasks.length === 0) return;
    if (this.availableWorkers.length === 0) return;

    const pending = this.pendingTasks.shift()!;
    const worker = this.availableWorkers.pop()!;

    this.taskMap.set(pending.task.id, pending);

    worker.postMessage({
      type: "parse",
      id: pending.task.id,
      fileName: pending.task.fileName,
      content: pending.task.content,
    });
  }

  /**
   * Parse a single file using an available worker.
   */
  parse(task: ParseTask): Promise<ParseResult> {
    if (this.isTerminated) {
      return Promise.resolve({
        id: task.id,
        success: false,
        error: "Worker pool has been terminated",
      });
    }

    return new Promise((resolve) => {
      this.pendingTasks.push({ task, resolve });
      this.processNextTask();
    });
  }

  /**
   * Parse multiple files concurrently.
   */
  async parseAll(
    tasks: ParseTask[],
    onProgress?: (completed: number, total: number, latest: ParseResult) => void
  ): Promise<ParseResult[]> {
    const results: ParseResult[] = [];
    let completed = 0;

    const promises = tasks.map((task) =>
      this.parse(task).then((result) => {
        completed++;
        onProgress?.(completed, tasks.length, result);
        return result;
      })
    );

    const settled = await Promise.all(promises);
    return settled;
  }

  /**
   * Terminate all workers in the pool.
   */
  terminate() {
    this.isTerminated = true;
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.pendingTasks = [];
    this.taskMap.clear();
  }

  /**
   * Get current pool status.
   */
  getStatus() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      pendingTasks: this.pendingTasks.length,
      isTerminated: this.isTerminated,
    };
  }
}

// Singleton instance for the app
let poolInstance: ParseWorkerPool | null = null;

export function getWorkerPool(): ParseWorkerPool {
  if (!poolInstance) {
    poolInstance = new ParseWorkerPool();
  }
  return poolInstance;
}

export function terminateWorkerPool() {
  if (poolInstance) {
    poolInstance.terminate();
    poolInstance = null;
  }
}
