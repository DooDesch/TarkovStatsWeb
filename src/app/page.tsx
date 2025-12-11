"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header, Navigation, DropZone } from "@/components/layout";
import {
  OverviewView,
  SessionsView,
  ErrorsView,
  InventoryView,
  NetworkView,
  MatchingView,
  QuestsView,
  RawDataView,
} from "@/components/views";
import { useLogImport } from "@/hooks/useLogImport";
import { useStore, type TabId } from "@/state";

export default function Home() {
  const {
    progress,
    parsedResults,
    insights,
    importFiles,
    importFromDirectory,
    importFromFileInput,
    reset,
    onDrop,
    isLoading,
    hasData,
    errorMessage,
  } = useLogImport();

  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  // Update store when data changes
  const setParsedResults = useStore((state) => state.setParsedResults);
  const setInsights = useStore((state) => state.setInsights);
  const setImportProgress = useStore((state) => state.setImportProgress);

  // Sync parsed results into store
  useEffect(() => {
    if (parsedResults.length > 0) {
      setParsedResults(parsedResults);
    }
  }, [parsedResults, setParsedResults]);

  // Sync insights into store
  useEffect(() => {
    if (insights) {
      setInsights(insights);
    }
  }, [insights, setInsights]);

  // Sync progress into store (optional UI consumers)
  useEffect(() => {
    setImportProgress(progress);
  }, [progress, setImportProgress]);

  const handleExport = useCallback(() => {
    if (!insights) return;
    const data = { insights, parsedResults };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tarkov-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [insights, parsedResults]);

  const handleReset = useCallback(() => {
    reset();
    useStore.getState().clearData();
  }, [reset]);

  const renderTabContent = () => {
    if (!insights) return null;

    switch (activeTab) {
      case "overview":
        return <OverviewView insights={insights} parsedResults={parsedResults} />;
      case "sessions":
        return <SessionsView sessions={insights.timelines} />;
      case "errors":
        return <ErrorsView errors={insights.errors} />;
      case "inventory":
        return <InventoryView inventory={insights.inventory} />;
      case "network":
        return <NetworkView connectivity={insights.connectivity} />;
      case "matching":
        return <MatchingView insights={insights} />;
      case "quests":
        return <QuestsView quests={insights.quests} />;
      case "raw":
        return <RawDataView insights={insights} parsedResults={parsedResults} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onExport={handleExport} onReset={handleReset} />

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        {/* Drop Zone - Always visible when no data or loading */}
        <AnimatePresence mode="wait">
          {(!hasData || isLoading) && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <DropZone
                progress={progress}
                onDrop={onDrop}
                onSelectFolder={importFromDirectory}
                onSelectFiles={importFromFileInput}
                errorMessage={errorMessage}
              />

              {!isLoading && !hasData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-16 text-center"
                >
                  <h2 className="text-xl font-semibold text-zinc-300 mb-3">
                    Ready to analyze your Tarkov logs
                  </h2>
                  <p className="text-zinc-500 max-w-lg mx-auto">
                    Import your log files to see detailed statistics about your sessions,
                    errors, inventory operations, network connectivity, matchmaking times,
                    and quest progress.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          {hasData && insights && !isLoading && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Navigation */}
              <Navigation />

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-4 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-zinc-500">
          <p>
            All log parsing happens locally in your browser. No data is sent to any server.
          </p>
          <p>
            Built with TarkovLogsLib
          </p>
        </div>
      </footer>
    </div>
  );
}
