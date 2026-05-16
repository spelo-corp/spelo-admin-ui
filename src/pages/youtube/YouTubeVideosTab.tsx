import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { CreateBatchModal } from "../../components/youtube/CreateBatchModal";
import { VideoStatusBadge } from "../../components/youtube/VideoStatusBadge";
import type {
    VideoIngestionStatus,
    YouTubeIngestionBatch,
    YouTubeVideo,
} from "../../types/youtube";
import { formatDuration, formatRelativeTime } from "./utils";
import type { YouTubeChannelOutletContext } from "./YouTubeChannelDetailPage";

const PAGE_SIZE = 20;

const SKELETON_ROWS = ["sk-0", "sk-1", "sk-2", "sk-3", "sk-4"];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "", label: "All Statuses" },
    { value: "NEW", label: "New" },
    { value: "QUEUED", label: "Queued" },
    { value: "PROCESSING", label: "Processing" },
    { value: "READY_FOR_REVIEW", label: "Ready for Review" },
    { value: "COMPLETED", label: "Completed" },
    { value: "FAILED", label: "Failed" },
    { value: "SKIPPED", label: "Skipped" },
    { value: "IGNORED", label: "Ignored" },
];

const YouTubeVideosTab: React.FC = () => {
    const { channel } = useOutletContext<YouTubeChannelOutletContext>();
    const navigate = useNavigate();

    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);

    const [statusFilter, setStatusFilter] = useState("");
    const [minDurMin, setMinDurMin] = useState("");
    const [maxDurMin, setMaxDurMin] = useState("");
    const [publishedAfter, setPublishedAfter] = useState("");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchModalOpen, setBatchModalOpen] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 300);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [search]);

    const loadVideos = useCallback(async () => {
        setLoading(true);
        try {
            const minSec =
                minDurMin !== "" ? Math.round(Number.parseFloat(minDurMin) * 60) : undefined;
            const maxSec =
                maxDurMin !== "" ? Math.round(Number.parseFloat(maxDurMin) * 60) : undefined;

            const res = await api.listVideos({
                channel_id: channel.id,
                status: statusFilter || undefined,
                min_duration: minSec,
                max_duration: maxSec,
                published_after: publishedAfter || undefined,
                search: debouncedSearch || undefined,
                page,
                size: PAGE_SIZE,
            });
            if (res.success) {
                setVideos(res.data);
                setTotal(res.total);
            }
        } finally {
            setLoading(false);
        }
    }, [channel.id, statusFilter, minDurMin, maxDurMin, publishedAfter, debouncedSearch, page]);

    useEffect(() => {
        void loadVideos();
    }, [loadVideos]);

    const handleStatusUpdate = async (
        video: YouTubeVideo,
        ingestion_status: VideoIngestionStatus,
    ) => {
        setActionLoading(video.id);
        try {
            await api.updateVideoStatus(video.id, { ingestion_status });
            await loadVideos();
        } finally {
            setActionLoading(null);
        }
    };

    const selectableVideos = videos.filter((v) => v.ingestion_status === "NEW");

    const allPageSelected =
        selectableVideos.length > 0 && selectableVideos.every((v) => selectedIds.has(v.id));

    const toggleSelectAll = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const v of selectableVideos) next.delete(v.id);
                return next;
            });
        } else {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const v of selectableVideos) next.add(v.id);
                return next;
            });
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBatchCreated = (_batch: YouTubeIngestionBatch) => {
        setSelectedIds(new Set());
        setBatchModalOpen(false);
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-4">
            {/* FILTER BAR */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex flex-wrap gap-3">
                    <select
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={minDurMin}
                        onChange={(e) => {
                            setMinDurMin(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Min minutes"
                        className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />

                    <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={maxDurMin}
                        onChange={(e) => {
                            setMaxDurMin(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Max minutes"
                        className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />

                    <input
                        type="date"
                        value={publishedAfter}
                        onChange={(e) => {
                            setPublishedAfter(e.target.value);
                            setPage(0);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search videos..."
                        className="flex-1 min-w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                            <th className="px-4 py-3 w-10 text-center">
                                <input
                                    type="checkbox"
                                    aria-label="Select all on page"
                                    checked={allPageSelected}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 cursor-pointer"
                                />
                            </th>
                            <th className="px-4 py-3 text-left w-20" />
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-right w-24">Duration</th>
                            <th className="px-4 py-3 text-left w-32">Published</th>
                            <th className="px-4 py-3 text-left w-36">Status</th>
                            <th className="px-4 py-3 text-right w-36">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            SKELETON_ROWS.map((key) => (
                                <tr key={key} className="border-b border-slate-50">
                                    <td className="px-4 py-3 w-10" />
                                    <td className="px-4 py-3">
                                        <div className="w-20 h-12 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-48 bg-slate-100 rounded animate-pulse mb-1" />
                                        <div className="h-3 w-32 bg-slate-50 rounded animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-12 bg-slate-100 rounded animate-pulse ml-auto" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
                                    </td>
                                    <td className="px-4 py-3" />
                                </tr>
                            ))
                        ) : videos.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-10 text-center text-slate-500 text-sm"
                                >
                                    No videos found for the current filters.
                                </td>
                            </tr>
                        ) : (
                            videos.map((video) => {
                                const isSelectable = video.ingestion_status === "NEW";
                                const isSelected = selectedIds.has(video.id);
                                return (
                                    <tr
                                        key={video.id}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 w-10 text-center">
                                            {isSelectable ? (
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select ${video.title}`}
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(video.id)}
                                                    className="rounded border-slate-300 cursor-pointer"
                                                />
                                            ) : (
                                                <span className="block w-4 h-4" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {video.thumbnail_url ? (
                                                <img
                                                    src={video.thumbnail_url}
                                                    alt={video.title}
                                                    className="w-20 h-12 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-20 h-12 rounded bg-slate-100" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p
                                                    className="font-medium text-slate-900 truncate"
                                                    title={video.title}
                                                >
                                                    {video.title}
                                                </p>
                                                {video.inferred_level && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 border border-violet-200 shrink-0">
                                                        AI: {video.inferred_level}
                                                        {video.inference_confidence &&
                                                            ` (${Math.round(video.inference_confidence * 100)}%)`}
                                                    </span>
                                                )}
                                                {video.ingestion_status === "COMPLETED" &&
                                                    video.auto_finalized && (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200 shrink-0">
                                                            Auto
                                                        </span>
                                                    )}
                                            </div>
                                            {video.description && (
                                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                                    {video.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                                            {formatDuration(video.duration_sec)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {formatRelativeTime(video.published_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <VideoStatusBadge status={video.ingestion_status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {video.ingestion_status === "NEW" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusUpdate(video, "SKIPPED")
                                                        }
                                                        disabled={actionLoading === video.id}
                                                        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-50"
                                                    >
                                                        Skip
                                                    </button>
                                                )}
                                                {(video.ingestion_status === "SKIPPED" ||
                                                    video.ingestion_status === "IGNORED" ||
                                                    video.ingestion_status === "FAILED") && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusUpdate(video, "NEW")
                                                        }
                                                        disabled={actionLoading === video.id}
                                                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                                {video.lesson_id !== null && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/admin/lessons/${video.lesson_id}/jobs`,
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
                                );
                            })
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

            {/* FLOATING BULK ACTION BAR */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl z-50">
                    <span className="text-sm font-medium">
                        {selectedIds.size} video{selectedIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        className="text-slate-400 text-sm hover:text-white"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={() => setBatchModalOpen(true)}
                        className="bg-white text-slate-900 px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-slate-100"
                    >
                        Queue {selectedIds.size} video{selectedIds.size !== 1 ? "s" : ""}
                    </button>
                </div>
            )}

            {/* CREATE BATCH MODAL */}
            <CreateBatchModal
                open={batchModalOpen}
                onClose={() => setBatchModalOpen(false)}
                onCreated={handleBatchCreated}
                selectedVideoIds={Array.from(selectedIds)}
                channelDefaults={{
                    defaultLessonLevel: channel.default_lesson_level,
                    defaultCategoryId: channel.default_category_id,
                }}
            />
        </div>
    );
};

export default YouTubeVideosTab;
