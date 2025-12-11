"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FolderOpen,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button, Progress } from "@/components/ui";
import type { ImportProgress } from "@/lib/logs/types";

export interface DropZoneProps {
  progress: ImportProgress;
  onDrop: (files: File[]) => void;
  onSelectFolder: () => void;
  onSelectFiles: () => void;
  errorMessage?: string | null;
  className?: string;
}

export function DropZone({
  progress,
  onDrop,
  onSelectFolder,
  onSelectFiles,
  errorMessage,
  className,
}: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".log"] },
    noClick: true,
  });

  const isLoading = progress.status !== "idle" && progress.status !== "complete" && progress.status !== "error";
  const isComplete = progress.status === "complete";
  const hasError = progress.status === "error" || !!errorMessage;

  const getProgressPercentage = () => {
    if (progress.filesTotal === 0) return 0;
    return (progress.filesProcessed / progress.filesTotal) * 100;
  };

  const getStatusText = () => {
    switch (progress.status) {
      case "reading":
        return "Reading files...";
      case "parsing":
        return "Parsing logs...";
      case "computing":
        return "Computing insights...";
      case "complete":
        return "Import complete!";
      case "error":
        return "Import failed";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <div
        {...getRootProps()}
        className={clsx(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          isDragActive
            ? "border-amber-500 bg-amber-500/10 scale-[1.02]"
            : hasError
            ? "border-red-500/50 bg-red-500/5"
            : isComplete
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-900/50"
        )}
      >
        <input {...getInputProps()} />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }} />
        </div>

        <div className="relative px-8 py-12 md:py-16">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full bg-amber-500/20 blur-xl" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                  {getStatusText()}
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  {progress.currentFile && (
                    <span className="block truncate max-w-sm">
                      {progress.currentFile}
                    </span>
                  )}
                  {progress.filesProcessed} / {progress.filesTotal} files
                </p>
                <Progress
                  value={getProgressPercentage()}
                  className="w-full max-w-xs"
                  size="md"
                  color="amber"
                />
              </motion.div>
            ) : isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full bg-emerald-500/20 blur-xl" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                  Import Complete!
                </h3>
                <p className="text-sm text-zinc-400">
                  Successfully processed {progress.filesTotal} files
                </p>
              </motion.div>
            ) : hasError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full bg-red-500/20 blur-xl" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                  Import Failed
                </h3>
                <p className="text-sm text-red-400 max-w-sm">
                  {errorMessage || progress.errorMessage || "An error occurred"}
                </p>
                <div className="mt-6 flex gap-3">
                  <Button variant="secondary" onClick={onSelectFolder}>
                    Try Again
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className={clsx(
                    "rounded-2xl p-4 transition-colors",
                    isDragActive ? "bg-amber-500/20" : "bg-zinc-800/50"
                  )}>
                    <Upload className={clsx(
                      "h-10 w-10 transition-colors",
                      isDragActive ? "text-amber-500" : "text-zinc-500"
                    )} />
                  </div>
                  {isDragActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl"
                    />
                  )}
                </div>

                <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                  {isDragActive ? "Drop files here" : "Import EFT Logs"}
                </h3>
                <p className="text-sm text-zinc-400 mb-6 max-w-md">
                  Drag and drop your Escape from Tarkov log folder or files here,
                  or click the buttons below to select them manually.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    variant="primary"
                    icon={FolderOpen}
                    onClick={onSelectFolder}
                  >
                    Select Logs Folder
                  </Button>
                  <Button
                    variant="secondary"
                    icon={FileText}
                    onClick={onSelectFiles}
                  >
                    Select Files
                  </Button>
                </div>

                <p className="text-xs text-zinc-600">
                  Default location:{" "}
                  <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    %LOCALAPPDATA%\Battlestate Games\Escape from Tarkov\Logs
                  </code>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
