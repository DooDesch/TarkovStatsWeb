/**
 * Central exports for file ingestion utilities.
 */

export {
  isLogFile,
  readFileAsText,
  readFilesWithProgress,
  collectFilesFromDirectory,
  filterLogFiles,
  sortFilesByPath,
  getTotalFileSize,
  formatBytes,
  extractSessionFromPath,
  groupFilesBySession,
  type FileReadResult,
  type FileReadProgress,
} from "./fileReader";

export {
  ParseWorkerPool,
  getWorkerPool,
  terminateWorkerPool,
  type ParseTask,
  type ParseResult,
} from "./parseWorkerPool";
