/**
 * React hook for importing and parsing log files.
 * Provides a unified API for file selection, parsing, and progress tracking.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ParsedLogResult, Insights, ImportProgress } from "@/lib/logs/types";
import { TarkovLogsInsights } from "tarkov-logs-lib/browser";
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

const initialProgress: ImportProgress = {
  status: "idle",
  filesProcessed: 0,
  filesTotal: 0,
  bytesProcessed: 0,
  bytesTotal: 0,
};

export function useLogImport(): UseLogImportReturn {
  const [progress, setProgress] = useState<ImportProgress>(initialProgress);
  const [parsedResults, setParsedResults] = useState<ParsedLogResult[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup worker pool on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setProgress(initialProgress);
    setParsedResults([]);
    setInsights(null);
    setErrorMessage(null);
  }, []);

  const importFiles = useCallback(async (files: File[]) => {
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
        .filter((r): r is ParseResult & { result: ParsedLogResult } => r.success && !!r.result)
        .map((r) => r.result);

      setParsedResults(successfulResults);

      // Phase 3: Compute insights
      if (successfulResults.length > 0) {
        setProgress((prev) => ({
          ...prev,
          status: "computing",
        }));

        const insightsEngine = new TarkovLogsInsights(successfulResults);
        const computedInsights = await insightsEngine.compute();
        setInsights(computedInsights);
      }

      setProgress((prev) => ({
        ...prev,
        status: "complete",
      }));
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown import error");
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
    
    // Actions
    importFiles,
    importFromDirectory,
    importFromFileInput,
    reset,
    
    // Dropzone helpers
    onDrop,
    
    // Computed
    isLoading: progress.status !== "idle" && progress.status !== "complete" && progress.status !== "error",
    hasData: parsedResults.length > 0,
    errorMessage,
  };
}

export default useLogImport;
