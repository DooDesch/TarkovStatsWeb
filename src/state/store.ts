/**
 * Central Zustand store for TarkovStatsWeb.
 * Manages parsed logs, insights, filters, and UI state.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ParsedLogResult,
  Insights,
  ImportProgress,
  SessionFilter,
  ErrorFilter,
  QuestFilter,
  NetworkFilter,
} from "@/lib/logs/types";
import { emptyInsights } from "@/lib/logs/fixtures";

// ============================================================================
// Types
// ============================================================================

export type TabId = "overview" | "sessions" | "errors" | "inventory" | "network" | "matching" | "quests" | "raw";

export interface UIState {
  activeTab: TabId;
  sidebarCollapsed: boolean;
  darkMode: boolean;
}

export interface FilterState {
  sessions: SessionFilter;
  errors: ErrorFilter;
  quests: QuestFilter;
  network: NetworkFilter;
  globalDateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DataState {
  parsedResults: ParsedLogResult[];
  insights: Insights;
  importProgress: ImportProgress;
}

export interface StoreState extends UIState, FilterState, DataState {
  // UI Actions
  setActiveTab: (tab: TabId) => void;
  toggleSidebar: () => void;
  setDarkMode: (enabled: boolean) => void;

  // Data Actions
  setParsedResults: (results: ParsedLogResult[]) => void;
  setInsights: (insights: Insights) => void;
  setImportProgress: (progress: ImportProgress) => void;
  clearData: () => void;

  // Filter Actions
  setSessionFilter: (filter: Partial<SessionFilter>) => void;
  setErrorFilter: (filter: Partial<ErrorFilter>) => void;
  setQuestFilter: (filter: Partial<QuestFilter>) => void;
  setNetworkFilter: (filter: Partial<NetworkFilter>) => void;
  setGlobalDateRange: (range: { start: Date; end: Date } | undefined) => void;
  resetFilters: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialImportProgress: ImportProgress = {
  status: "idle",
  filesProcessed: 0,
  filesTotal: 0,
  bytesProcessed: 0,
  bytesTotal: 0,
};

const initialFilters: FilterState = {
  sessions: {},
  errors: {},
  quests: {},
  network: {},
  globalDateRange: undefined,
};

// ============================================================================
// Store
// ============================================================================

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Initial UI State
      activeTab: "overview",
      sidebarCollapsed: false,
      darkMode: true,

      // Initial Filter State
      ...initialFilters,

      // Initial Data State
      parsedResults: [],
      insights: emptyInsights,
      importProgress: initialImportProgress,

      // UI Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setDarkMode: (enabled) => set({ darkMode: enabled }),

      // Data Actions
      setParsedResults: (results) => set({ parsedResults: results }),
      setInsights: (insights) => set({ insights }),
      setImportProgress: (progress) => set({ importProgress: progress }),
      clearData: () =>
        set({
          parsedResults: [],
          insights: emptyInsights,
          importProgress: initialImportProgress,
        }),

      // Filter Actions
      setSessionFilter: (filter) =>
        set((state) => ({
          sessions: { ...state.sessions, ...filter },
        })),
      setErrorFilter: (filter) =>
        set((state) => ({
          errors: { ...state.errors, ...filter },
        })),
      setQuestFilter: (filter) =>
        set((state) => ({
          quests: { ...state.quests, ...filter },
        })),
      setNetworkFilter: (filter) =>
        set((state) => ({
          network: { ...state.network, ...filter },
        })),
      setGlobalDateRange: (range) => set({ globalDateRange: range }),
      resetFilters: () => set(initialFilters),
    }),
    {
      name: "tarkov-stats-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences, not data
      partialize: (state) => ({
        activeTab: state.activeTab,
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
        sessions: state.sessions,
        errors: state.errors,
        quests: state.quests,
        network: state.network,
      }),
    }
  )
);

// ============================================================================
// Selectors (for memoized derived state)
// ============================================================================

// Data selectors
export const selectParsedResults = (state: StoreState) => state.parsedResults;
export const selectInsights = (state: StoreState) => state.insights;
export const selectImportProgress = (state: StoreState) => state.importProgress;

// UI selectors
export const selectActiveTab = (state: StoreState) => state.activeTab;
export const selectSidebarCollapsed = (state: StoreState) => state.sidebarCollapsed;
export const selectDarkMode = (state: StoreState) => state.darkMode;

// Filter selectors
export const selectSessionFilter = (state: StoreState) => state.sessions;
export const selectErrorFilter = (state: StoreState) => state.errors;
export const selectQuestFilter = (state: StoreState) => state.quests;
export const selectNetworkFilter = (state: StoreState) => state.network;
export const selectGlobalDateRange = (state: StoreState) => state.globalDateRange;

// Computed selectors
export const selectHasData = (state: StoreState) => state.parsedResults.length > 0;
export const selectIsLoading = (state: StoreState) => {
  const status = state.importProgress.status;
  return status !== "idle" && status !== "complete" && status !== "error";
};
export const selectTotalEvents = (state: StoreState) =>
  state.parsedResults.reduce((sum, r) => sum + r.events.length, 0);
export const selectUniqueLogTypes = (state: StoreState) =>
  Array.from(new Set(state.parsedResults.map((r) => r.logType)));

// ============================================================================
// Hooks for specific store slices
// ============================================================================

export const useActiveTab = () => useStore((state) => state.activeTab);
export const useSetActiveTab = () => useStore((state) => state.setActiveTab);

export const useInsights = () => useStore((state) => state.insights);
export const useParsedResults = () => useStore((state) => state.parsedResults);

export const useImportProgress = () => useStore((state) => state.importProgress);
export const useSetImportProgress = () => useStore((state) => state.setImportProgress);

export const useHasData = () => useStore(selectHasData);
export const useIsLoading = () => useStore(selectIsLoading);

// Filter hooks
export const useSessionFilter = () => useStore(selectSessionFilter);
export const useErrorFilter = () => useStore(selectErrorFilter);
export const useQuestFilter = () => useStore(selectQuestFilter);
export const useNetworkFilter = () => useStore(selectNetworkFilter);
