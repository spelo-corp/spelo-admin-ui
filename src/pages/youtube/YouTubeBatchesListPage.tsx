import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { YouTubeIngestionBatch } from "../../types/youtube";
import { formatRelativeTime } from "./utils";

function batchIsInProgress(batch: YouTubeIngestionBatch): boolean {
    return batch.completed_count + batch.failed_count < batch.total_videos;
}

const YouTubeBatchesListPage: React.FC = () => {
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: ["youtube-batches"],
        queryFn: () => api.listBatches({ page: 0, size: 50 }),
        refetchInterval: (query) => {
            const batches = query.state.data?.data ?? [];
            return batches.some(batchIsInProgress) ? 10_000 : false;
        },
    });

    const batches = data?.data ?? [];

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ingestion Batches</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Track batch video ingestion progress
                    </p>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">Loading...</div>
                ) : error ? (
                    <div className="px-6 py-12 text-center text-rose-600 text-sm">
                        Failed to load batches.
                    </div>
                ) : batches.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">
                        No ingestion batches yet.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left w-52">Progress</th>
                                <th className="px-4 py-3 text-right w-24">Failed</th>
                                <th className="px-4 py-3 text-left w-36">Created</th>
                                <th className="px-4 py-3 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((batch) => {
                                const pct =
                                    batch.total_videos > 0
                                        ? Math.round(
                                              (batch.completed_count / batch.total_videos) * 100,
                                          )
                                        : 0;
                                return (
                                    <tr
                                        key={batch.id}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900">
                                                {batch.name ?? `Batch #${batch.id}`}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {batch.total_videos} video
                                                {batch.total_videos !== 1 ? "s" : ""}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-40 bg-slate-100 rounded-full h-2">
                                                    <div
                                                        className="bg-emerald-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500 tabular-nums">
                                                    {batch.completed_count}/{batch.total_videos}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {batch.failed_count > 0 ? (
                                                <span className="text-rose-600 font-medium">
                                                    {batch.failed_count}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">0</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {formatRelativeTime(batch.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/admin/youtube/batches/${batch.id}`)
                                                }
                                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default YouTubeBatchesListPage;
