"use client";

import { useCallback, useEffect, useState } from "react";
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
  BackendView,
  AudioView,
  RawDataView,
} from "@/components/views";
import { useLogImport, type GameDataSource } from "@/hooks/useLogImport";
import { useStore, type TabId } from "@/state";
import { Radio, RadioGroup } from "@/components/ui";

export default function Home() {
  const [gameDataSource, setGameDataSource] = useState<GameDataSource>("none");
  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "page:gameDataSource",
        message: "gameDataSource changed",
        data: { gameDataSource },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [gameDataSource]);
  // #endregion

  const {
    progress,
    parsedResults,
    insights,
    statistics,
    importFiles,
    importFromDirectory,
    importFromFileInput,
    reset,
    onDrop,
    isLoading,
    hasData,
    errorMessage,
  } = useLogImport(gameDataSource);

  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  // Update store when data changes
  const setParsedResults = useStore((state) => state.setParsedResults);
  const setInsights = useStore((state) => state.setInsights);
  const setStatistics = useStore((state) => state.setStatistics);
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

  // Sync statistics into store
  useEffect(() => {
    if (statistics) {
      setStatistics(statistics);
    }
  }, [statistics, setStatistics]);

  // Sync progress into store (optional UI consumers)
  useEffect(() => {
    setImportProgress(progress);
  }, [progress, setImportProgress]);

  const handleExport = useCallback(() => {
    if (!insights) return;
    const data = { insights, statistics, parsedResults };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tarkov-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [insights, statistics, parsedResults]);

  const handleReset = useCallback(() => {
    reset();
    useStore.getState().clearData();
  }, [reset]);

  const handleGameDataChange = useCallback((v: GameDataSource) => {
    fetch("http://127.0.0.1:7242/ingest/95d4494b-1062-4c41-ae10-5d78be834375", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "page:radioChange",
        message: "radio change",
        data: { value: v },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    setGameDataSource(v);
  }, []);

  const renderTabContent = () => {
    if (!insights) return null;

    switch (activeTab) {
      case "overview":
        return (
          <OverviewView insights={insights} parsedResults={parsedResults} />
        );
      case "sessions":
        return <SessionsView sessions={insights.timelines} />;
      case "errors":
        return <ErrorsView errors={insights.errors} />;
      case "inventory":
        return <InventoryView inventory={insights.inventory} />;
      case "network":
        return (
          <NetworkView
            connectivity={insights.connectivity}
            networkStats={statistics?.network}
          />
        );
      case "matching":
        return <MatchingView insights={insights} />;
      case "quests":
        return <QuestsView quests={insights.quests} />;
      case "backend":
        return statistics ? (
          <BackendView backend={statistics.backend} cache={statistics.cache} />
        ) : null;
      case "audio":
        return statistics ? (
          <AudioView
            push={statistics.push}
            audio={statistics.audio}
            anticheat={statistics.anticheat}
          />
        ) : null;
      case "raw":
        return (
          <RawDataView insights={insights} parsedResults={parsedResults} />
        );
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
              <div className="space-y-6">
                <DropZone
                  progress={progress}
                  onDrop={onDrop}
                  onSelectFolder={importFromDirectory}
                  onSelectFiles={importFromFileInput}
                  errorMessage={errorMessage}
                />

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">
                        Daten-Anreicherung (optional)
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Wähle, ob IDs (Trader, Quests, Items) mit externen
                        Quellen aufgelöst werden sollen. TarkovDev nutzt die
                        öffentliche GraphQL-API, TarkovTracker lädt statische
                        JSONs.
                      </p>
                    </div>
                    <RadioGroup
                      value={gameDataSource}
                      onChange={(v) => setGameDataSource(v as GameDataSource)}
                      className="grid gap-2 md:grid-cols-3"
                    >
                      <Radio
                      value="none"
                        description="Keine Auflösung, rein lokale Log-Daten."
                      >
                        Keine Anreicherung
                      </Radio>
                      <Radio
                      value="tarkovDev"
                        description="Online, GraphQL (api.tarkov.dev). Liefert Items/Quests/Trader."
                      >
                        TarkovDev
                      </Radio>
                      <Radio
                      value="tarkovTracker"
                        description="Online, statische JSONs (tarkovtracker). Keine API-Keys nötig."
                      >
                        TarkovTracker
                      </Radio>
                    </RadioGroup>
                  </div>
                </div>
              </div>

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
                    Import your log files to see detailed statistics about your
                    sessions, errors, inventory operations, network
                    connectivity, matchmaking times, and quest progress.
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
            All log parsing happens locally in your browser. No data is sent to
            any server.
          </p>
          <p>Built with TarkovLogsLib</p>
        </div>
      </footer>
    </div>
  );
}
