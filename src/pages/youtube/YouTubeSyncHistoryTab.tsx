import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import type { YouTubeSyncLog } from "../../types/youtube";
import { formatRelativeTime } from "./utils";
import type { YouTubeChannelOutletContext } from "./YouTubeChannelDetailPage";

const PAGE_SIZE = 20;

function formatDurationSec(startedAt: string, finishedAt: string | null): string {
    if (!finishedAt) return "In progress";
    const diffMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const secs = Math.round(diffMs / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
}

const SKELETON_ROWS = ["sk-0", "sk-1", "sk-2", "sk-3", "sk-4"];

const YouTubeSyncHistoryTab: React.FC = () => {
    const { channel } = useOutletContext<YouTubeChannelOutletContext>();

    const [logs, setLogs] = useState<YouTubeSyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getSyncLog(channel.id, { page, size: PAGE_SIZE });
            if (res.success) {
                setLogs(res.data);
                setTotal(res.total);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sync history.");
        } finally {
            setLoading(false);
        }
    }, [channel.id, page]);

    useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Sync History</h2>

            {error && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                            <th className="px-4 py-3 text-left">Triggered By</th>
                            <th className="px-4 py-3 text-left">Mode</th>
                            <th className="px-4 py-3 text-right">New</th>
                            <th className="px-4 py-3 text-right">Updated</th>
                            <th className="px-4 py-3 text-right">Auto-queued</th>
                            <th className="px-4 py-3 text-right">Quota Units</th>
                            <th className="px-4 py-3 text-right">Duration</th>
                            <th className="px-4 py-3 text-left">Started</th>
                            <th className="px-4 py-3 text-left">Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            SKELETON_ROWS.map((key) => (
                                <tr key={key} className="border-b border-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-8 bg-slate-100 rounded animate-pulse ml-auto" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-8 bg-slate-100 rounded animate-pulse ml-auto" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-8 bg-slate-100 rounded animate-pulse ml-auto" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-12 bg-slate-100 rounded animate-pulse ml-auto" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-12 bg-slate-100 rounded animate-pulse ml-auto" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3" />
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-12 text-center text-slate-500 text-sm"
                                >
                                    No sync history yet. Trigger a manual sync or enable auto-sync.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        {log.triggered_by === "MANUAL" ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                Manual
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                Scheduled
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">
                                        {log.mode === "FULL" ? "Full" : "Incremental"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span
                                            className={
                                                log.new_videos_count > 0
                                                    ? "text-emerald-600 font-medium"
                                                    : "text-slate-500"
                                            }
                                        >
                                            {log.new_videos_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600">
                                        {log.updated_videos_count}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span
                                            className={
                                                log.auto_queued_count > 0
                                                    ? "text-blue-600 font-medium"
                                                    : "text-slate-500"
                                            }
                                        >
                                            {log.auto_queued_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600">
                                        {log.quota_units_used.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                                        {formatDurationSec(log.started_at, log.finished_at)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                        {formatRelativeTime(log.started_at)}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {log.error_message && (
                                            <span
                                                className="text-rose-600"
                                                title={log.error_message}
                                            >
                                                {log.error_message.length > 40
                                                    ? `${log.error_message.slice(0, 40)}…`
                                                    : log.error_message}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}{" "}
                            of {total}
                        </span>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YouTubeSyncHistoryTab;
