"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, Zap, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@/components/ui";
import type { SessionTimeline } from "@/lib/logs/types";
import { sortSessionsByDate, getSessionDuration } from "@/lib/logs/selectors";

export interface SessionsViewProps {
  sessions: SessionTimeline[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function SessionsView({ sessions }: SessionsViewProps) {
  const sortedSessions = useMemo(() => sortSessionsByDate(sessions), [sessions]);

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No Sessions"
        description="No session timeline data available in the loaded logs"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Session Timelines</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedSessions.map((session, idx) => {
          const duration = getSessionDuration(session);

          return (
            <motion.div
              key={session.sessionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card variant="glass" hover>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-zinc-100 truncate">
                        {session.sessionId.startsWith("file:")
                          ? session.sessionId.replace("file:", "").split(/[\\/]/).pop()
                          : session.sessionId.length > 32
                          ? `Session ${session.sessionId.slice(0, 16)}...`
                          : session.sessionId}
                      </h3>
                      {session.buildVersion && (
                        <Badge variant="info" size="sm">
                          v{session.buildVersion}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                      {session.startedAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(session.startedAt)}
                        </span>
                      )}
                      {session.endedAt && (
                        <span>→ {formatDate(session.endedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {duration !== null && (
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                        <Clock className="h-4 w-4 text-zinc-500" />
                        <div>
                          <div className="text-xs text-zinc-500">Duration</div>
                          <div className="text-sm font-medium text-zinc-200">
                            {formatDuration(duration)}
                          </div>
                        </div>
                      </div>
                    )}
                    {session.startupDurationMs !== undefined && (
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                        <Zap className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div className="text-xs text-zinc-500">Startup</div>
                          <div className="text-sm font-medium text-emerald-400">
                            {formatDuration(session.startupDurationMs)}
                          </div>
                        </div>
                      </div>
                    )}
                    {session.matchmakingDurationMs !== undefined && (
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <div>
                          <div className="text-xs text-zinc-500">Match</div>
                          <div className="text-sm font-medium text-amber-400">
                            {formatDuration(session.matchmakingDurationMs)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {session.firstBackendAt && (
                    <Badge variant="info" dot>
                      Backend: {new Date(session.firstBackendAt).toLocaleTimeString()}
                    </Badge>
                  )}
                  {session.firstConnectAt && (
                    <Badge variant="success" dot>
                      Connected: {new Date(session.firstConnectAt).toLocaleTimeString()}
                    </Badge>
                  )}
                  {session.firstMatchEventAt && (
                    <Badge variant="warning" dot>
                      Match: {new Date(session.firstMatchEventAt).toLocaleTimeString()}
                    </Badge>
                  )}
                  {session.firstErrorAt && (
                    <Badge variant="error" dot>
                      First Error: {new Date(session.firstErrorAt).toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
