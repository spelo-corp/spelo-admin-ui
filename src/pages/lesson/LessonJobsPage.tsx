import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { RefreshCcw, Loader2, FolderOpen, ExternalLink } from "lucide-react";
import { api } from "../../api/client";
import type { ProcessingJob } from "../../types";
import type { AudioJob } from "../../types/audioProcessing";
import type { LessonOutletContext } from "../LessonViewPage";
import { Btn } from "../../components/ui/Btn";
import { StatusBadge } from "../../components/audioProcessing/StatusBadge";
import JobStatusBadge from "../../components/jobs/JobStatusBadge";

type AllJobs = {
    type: "processing" | "audio";
    job: ProcessingJob | AudioJob;
    id: number;
    createdAt: string;
    lessonId: number;
    lessonName?: string;
    jobType?: string;
};

const LessonJobsPage: React.FC = () => {
    const { lessonId } = useParams();
    const { lessonMeta, loading: lessonLoading } = useOutletContext<LessonOutletContext>();

    const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
    const [audioJobs, setAudioJobs] = useState<AudioJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Infinite scroll state
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(20);

    const observerTarget = useRef<HTMLDivElement>(null);

    const loadJobs = useCallback(async (page: number, isRefresh: boolean = false) => {
        if (!lessonId) return;

        if (page === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const numericLessonId = Number(lessonId);

            // Fetch ALL job types for this lesson (not just audio processing)
            const [allJobsRes, audioRes] = await Promise.all([
                api.getJobs({ lesson_id: numericLessonId, page: 1, size: 100 }).catch(() => ({
                    success: false,
                    data: [],
                    total: 0,
                    page: 1,
                    size: 100
                })),
                api.getAudioProcessingJobs({ lessonId: numericLessonId, page, size: pageSize }).catch(() => ({
                    content: [] as AudioJob[],
                    pageNumber: 1,
                    pageSize: 20,
                    totalElements: 0,
                    totalPages: 1,
                    last: true,
                })),
            ]);

            // Convert jobs from new API format to ProcessingJob format for display
            if (page === 1 && allJobsRes.success && allJobsRes.data) {
                const convertedJobs: (ProcessingJob & { job_type?: string })[] = allJobsRes.data.map((job: any) => ({
                    id: job.id,
                    lesson_id: numericLessonId,
                    lesson_name: undefined,
                    original_audio_url: "",
                    current_step: job.current_step || job.status,
                    created_at: job.created_at,
                    progress_percent: job.progress_percent,
                    job_type: job.job_type, // Store job type from API
                }));
                setProcessingJobs(convertedJobs);
            }

            // Handle paginated audio jobs response
            if (audioRes && typeof audioRes === "object" && "content" in audioRes) {
                if (isRefresh || page === 1) {
                    // Replace jobs on refresh or first page
                    setAudioJobs(audioRes.content);
                } else {
                    // Append jobs for infinite scroll
                    setAudioJobs(prev => [...prev, ...audioRes.content]);
                }

                setTotalElements(audioRes.totalElements);
                setCurrentPage(page);
                setHasMore(!audioRes.last && page < audioRes.totalPages);
            } else {
                // Fallback for non-paginated response
                const jobsArray = Array.isArray(audioRes) ? audioRes : [];
                setAudioJobs(jobsArray);
                setTotalElements(jobsArray.length);
                setHasMore(false);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load jobs.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [lessonId, pageSize]);

    useEffect(() => {
        void loadJobs(1);
    }, [lessonId]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    void loadJobs(currentPage + 1);
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loading, loadingMore, currentPage, loadJobs]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setCurrentPage(1);
        setHasMore(true);
        await loadJobs(1, true);
        setRefreshing(false);
    };

    const allJobs = useMemo<AllJobs[]>(() => {
        const processing: AllJobs[] = processingJobs.map((job) => ({
            type: "processing" as const,
            job,
            id: job.id,
            createdAt: job.created_at,
            lessonId: job.lesson_id,
            lessonName: job.lesson_name,
            jobType: (job as any).job_type || "UNKNOWN", // Extract actual job type from API
        }));

        const audio: AllJobs[] = audioJobs.map((job) => ({
            type: "audio" as const,
            job,
            id: job.id,
            createdAt: job.createdAt,
            lessonId: job.lessonId,
            lessonName: job.lessonName,
            jobType: "AUDIO_ALIGN",
        }));

        return [...processing, ...audio].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [processingJobs, audioJobs]);

    const stats = useMemo(() => {
        return [
            { label: "Total Jobs", value: totalElements + processingJobs.length },
            { label: "Legacy Jobs", value: processingJobs.length },
            { label: "Audio Jobs", value: totalElements },
        ];
    }, [totalElements, processingJobs]);

    if (lessonLoading && loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Jobs for {lessonMeta?.name || `Lesson #${lessonId}`}</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        All processing jobs associated with this lesson
                    </p>
                </div>
                <Btn.Secondary onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Btn.Secondary>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow-sm"
                    >
                        <div className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</div>
                        <div className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</div>
                    </div>
                ))}
            </div>

            {error && (
                <div className="px-4 py-3 rounded-lg text-sm text-rose-600 bg-rose-50 border border-rose-100">
                    {error}
                </div>
            )}

            {/* Jobs List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-900">All Jobs</h3>
                        <span className="text-xs text-slate-500">({allJobs.length} loaded{hasMore ? ', more available' : ''})</span>
                    </div>
                </div>

                {loading ? (
                    <div className="px-5 py-10 flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading jobs…
                    </div>
                ) : allJobs.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                            <FolderOpen className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-slate-700">No jobs found</p>
                        <p className="text-sm text-slate-500 mt-1">
                            This lesson doesn't have any audio processing jobs yet.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-slate-500 uppercase text-xs tracking-wide">
                                    <tr>
                                        <th className="px-5 py-3">Job ID</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Created</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allJobs.map((item) => {
                                        const isProcessing = item.type === "processing";
                                        const job = item.job;

                                        return (
                                            <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/60">
                                                <td className="px-5 py-3">
                                                    <div className="font-semibold text-slate-900">#{item.id}</div>
                                                    {isProcessing && (
                                                        <div className="text-[11px] text-slate-500">
                                                            {(job as ProcessingJob).original_audio_url?.slice(0, 30) || "—"}
                                                            {(job as ProcessingJob).original_audio_url?.length > 30 ? "…" : ""}
                                                        </div>
                                                    )}
                                                    {!isProcessing && (
                                                        <div className="text-[11px] text-slate-500">
                                                            {(job as AudioJob).transcript?.slice(0, 30) || "—"}
                                                            {(job as AudioJob).transcript?.length > 30 ? "…" : ""}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {(() => {
                                                        const jobType = isProcessing ? (item.jobType || "UNKNOWN") : "AUDIO_ALIGN";
                                                        const badgeColors: Record<string, string> = {
                                                            "VOCAB_ENRICH": "bg-purple-100 text-purple-700",
                                                            "VOCAB_EXTRACT": "bg-purple-100 text-purple-700",
                                                            "VOCAB_SCRIPT_MAP": "bg-purple-100 text-purple-700",
                                                            "AUDIO_ALIGN": "bg-blue-100 text-blue-700",
                                                            "YOUTUBE_ALIGN": "bg-red-100 text-red-700",
                                                            "LESSON_TRANSLATE": "bg-green-100 text-green-700",
                                                            "AI_SCORING": "bg-amber-100 text-amber-700",
                                                            "UPLOAD_TO_R2": "bg-cyan-100 text-cyan-700",
                                                            "COLLECTION_GENERATE": "bg-teal-100 text-teal-700",
                                                            "UNKNOWN": "bg-slate-100 text-slate-700",
                                                        };
                                                        const colorClass = badgeColors[jobType] || badgeColors["UNKNOWN"];

                                                        return (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}>
                                                                {jobType.replace(/_/g, " ")}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {isProcessing ? (
                                                        <JobStatusBadge status={(job as ProcessingJob).current_step} />
                                                    ) : (
                                                        <StatusBadge status={(job as AudioJob).status} />
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-slate-700">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <Link
                                                        to={
                                                            isProcessing
                                                                ? (item.jobType === "YOUTUBE_ALIGN"
                                                                    ? `/admin/jobs/youtube/${item.id}`
                                                                    : `/admin/processing-jobs/${item.id}/review`)
                                                                : `/admin/jobs/audio/jobs/${item.id}`
                                                        }
                                                        className="inline-flex items-center gap-1 text-brand font-semibold hover:underline text-xs"
                                                    >
                                                        View
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Infinite Scroll Loading Indicator */}
                        {hasMore && (
                            <div ref={observerTarget} className="px-5 py-4 border-t border-slate-100 bg-slate-50">
                                {loadingMore ? (
                                    <div className="flex items-center justify-center gap-2 text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading more jobs…
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-slate-500">
                                        Scroll for more
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasMore && audioJobs.length > 0 && (
                            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 text-center text-sm text-slate-500">
                                No more jobs to load
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LessonJobsPage;
