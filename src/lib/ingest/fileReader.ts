/**
 * File reading utilities for browser-based log import.
 * Supports drag-and-drop, folder selection, and file input.
 */

export interface FileReadResult {
  fileName: string;
  content: string;
  sizeBytes: number;
}

export interface FileReadProgress {
  filesRead: number;
  filesTotal: number;
  bytesRead: number;
  bytesTotal: number;
  currentFile?: string;
}

/**
 * Check if a file is a valid log file.
 */
export function isLogFile(fileName: string): boolean {
  const baseName = fileName.split(/[\\/]/).pop() ?? fileName;
  return baseName.endsWith(".log");
}

/**
 * Read a single file as text.
 */
export async function readFileAsText(file: File): Promise<FileReadResult> {
  const content = await file.text();
  return {
    fileName: file.name,
    content,
    sizeBytes: file.size,
  };
}

/**
 * Read multiple files with progress callback.
 */
export async function readFilesWithProgress(
  files: File[],
  onProgress?: (progress: FileReadProgress) => void
): Promise<FileReadResult[]> {
  const results: FileReadResult[] = [];
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  let bytesRead = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    onProgress?.({
      filesRead: i,
      filesTotal: files.length,
      bytesRead,
      bytesTotal: totalBytes,
      currentFile: file.name,
    });

    const result = await readFileAsText(file);
    results.push(result);
    bytesRead += file.size;
  }

  onProgress?.({
    filesRead: files.length,
    filesTotal: files.length,
    bytesRead: totalBytes,
    bytesTotal: totalBytes,
  });

  return results;
}

/**
 * Collect all .log files from a FileSystemDirectoryHandle (File System Access API).
 * Note: This uses the File System Access API which may not be available in all browsers.
 */
export async function collectFilesFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path = ""
): Promise<File[]> {
  const files: File[] = [];

  // Use entries() iterator which is more widely typed
  const entries = (dirHandle as any).values() as AsyncIterable<FileSystemHandle>;
  
  for await (const entry of entries) {
    if (entry.kind === "file" && entry.name.endsWith(".log")) {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      // Create a new file with the full path as name for session detection
      const fileWithPath = new File([file], path + entry.name, {
        type: file.type,
        lastModified: file.lastModified,
      });
      files.push(fileWithPath);
    } else if (entry.kind === "directory") {
      const subFiles = await collectFilesFromDirectory(
        entry as FileSystemDirectoryHandle,
        path + entry.name + "/"
      );
      files.push(...subFiles);
    }
  }

  return files;
}

/**
 * Filter an array of files to only include .log files.
 */
export function filterLogFiles(files: File[]): File[] {
  return files.filter((file) => isLogFile(file.name));
}

/**
 * Sort files by their path/name for consistent session grouping.
 */
export function sortFilesByPath(files: File[]): File[] {
  return [...files].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get total size of files in bytes.
 */
export function getTotalFileSize(files: File[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Extract session folder name from file path.
 * EFT logs are typically in folders like "log_2025.01.15_14-30-00_1.0.0.0.12345"
 */
export function extractSessionFromPath(filePath: string): string | null {
  const parts = filePath.split(/[\\/]/);
  const sessionFolder = parts.find((p) => p.startsWith("log_"));
  return sessionFolder ?? null;
}

/**
 * Group files by their session folder.
 */
export function groupFilesBySession(files: File[]): Map<string, File[]> {
  const groups = new Map<string, File[]>();

  files.forEach((file) => {
    const session = extractSessionFromPath(file.name) ?? "unknown";
    const existing = groups.get(session) ?? [];
    existing.push(file);
    groups.set(session, existing);
  });

  return groups;
}
