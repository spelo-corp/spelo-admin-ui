import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { BatchItemStatusBadge } from "../../components/youtube/BatchItemStatusBadge";
import type { BatchItem } from "../../types/youtube";
import { formatDuration, formatRelativeTime } from "./utils";

function hasPendingItems(items: BatchItem[]): boolean {
    return items.some((i) => i.status === "PENDING");
}

function hasFailedItems(items: BatchItem[]): boolean {
    return items.some((i) => i.status === "FAILED");
}

function hasInProgressItems(items: BatchItem[]): boolean {
    return items.some((i) => i.status === "JOB_DISPATCHED");
}

const YouTubeBatchDetailPage: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const id = Number(batchId);

    const {
        data: batch,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["youtube-batch", id],
        queryFn: () => api.getBatch(id),
        enabled: !Number.isNaN(id),
        refetchInterval: (query) => {
            const items = query.state.data?.items ?? [];
            return hasInProgressItems(items) ? 5_000 : false;
        },
    });

    const cancelMutation = useMutation({
        mutationFn: () => api.cancelBatch(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["youtube-batch", id] });
        },
    });

    const retryMutation = useMutation({
        mutationFn: () => api.retryFailedBatch(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["youtube-batch", id] });
        },
    });

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
                Loading...
            </div>
        );
    }

    if (error || !batch) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-8 text-center text-rose-600 text-sm">
                Failed to load batch.
            </div>
        );
    }

    const items = batch.items ?? [];
    const pct =
        batch.total_videos > 0 ? Math.round((batch.completed_count / batch.total_videos) * 100) : 0;

    const canCancel = hasPendingItems(items);
    const canRetry = hasFailedItems(items);
    const cancelError = cancelMutation.error instanceof Error ? cancelMutation.error.message : null;
    const retryError = retryMutation.error instanceof Error ? retryMutation.error.message : null;

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            {/* BACK LINK */}
            <button
                type="button"
                onClick={() => navigate("/admin/youtube/batches")}
                className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
                ← Batches
            </button>

            {/* HEADER */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {batch.name ?? `Batch #${batch.id}`}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Created {formatRelativeTime(batch.created_at)} &middot; {batch.total_videos}{" "}
                        video{batch.total_videos !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                        <div className="w-48 bg-slate-100 rounded-full h-2">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">
                            {batch.completed_count}/{batch.total_videos} completed
                            {batch.failed_count > 0 && (
                                <span className="text-rose-500 ml-2">
                                    &middot; {batch.failed_count} failed
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => cancelMutation.mutate()}
                        disabled={!canCancel || cancelMutation.isPending}
                        className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {cancelMutation.isPending ? "Cancelling..." : "Cancel Pending"}
                    </button>
                    <button
                        type="button"
                        onClick={() => retryMutation.mutate()}
                        disabled={!canRetry || retryMutation.isPending}
                        className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {retryMutation.isPending ? "Retrying..." : "Retry Failed"}
                    </button>
                </div>
            </div>

            {/* MUTATION ERRORS */}
            {cancelError && <p className="text-sm text-rose-600">{cancelError}</p>}
            {retryError && <p className="text-sm text-rose-600">{retryError}</p>}

            {/* ITEMS TABLE */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {items.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">
                        No items in this batch.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                                <th className="px-4 py-3 text-left w-20" />
                                <th className="px-4 py-3 text-left">Video</th>
                                <th className="px-4 py-3 text-right w-24">Duration</th>
                                <th className="px-4 py-3 text-left w-40">Status</th>
                                <th className="px-4 py-3 text-right w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        {item.thumbnail_url ? (
                                            <img
                                                src={item.thumbnail_url}
                                                alt={item.video_title}
                                                className="w-20 h-12 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-12 rounded bg-slate-100" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 max-w-xs">
                                        <p
                                            className="font-medium text-slate-900 truncate"
                                            title={item.video_title}
                                        >
                                            {item.video_title}
                                        </p>
                                        {item.error_message && (
                                            <p className="text-xs text-rose-500 truncate mt-0.5">
                                                {item.error_message}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                                        {formatDuration(item.duration_sec)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <BatchItemStatusBadge status={item.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {item.status === "READY_FOR_REVIEW" &&
                                                item.job_id !== null && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/admin/jobs/youtube/${item.job_id}/sentences`,
                                                            )
                                                        }
                                                        className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                            {item.status === "FINALIZED" &&
                                                item.lesson_id !== null && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/admin/lessons/${item.lesson_id}/jobs`,
                                                            )
                                                        }
                                                        className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50"
                                                    >
                                                        View Lesson
                                                    </button>
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default YouTubeBatchDetailPage;
