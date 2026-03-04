import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import PageHeader from "../../components/common/PageHeader";
import type { Job } from "../../types/jobService";

const statusBadge: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-700",
    RUNNING: "bg-sky-100 text-sky-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-rose-100 text-rose-700",
};

function formatElapsed(startIso: string): string {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const BookIngestProgressPage: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();

    const [job, setJob] = useState<Job | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState("");
    const redirectedRef = useRef(false);

    // Poll job status every 2 seconds
    useEffect(() => {
        if (!jobId) return;

        let active = true;

        const poll = async () => {
            try {
                const data = await api.getBookIngestJob(Number(jobId));
                if (!active) return;
                setJob(data);
                setError(null);
            } catch (err: unknown) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Failed to fetch job status.");
            }
        };

        void poll();
        const interval = window.setInterval(poll, 2000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [jobId]);

    // Update elapsed time every second
    useEffect(() => {
        if (!job?.created_at) return;

        const tick = () => setElapsed(formatElapsed(job.created_at));
        tick();
        const interval = window.setInterval(tick, 1000);

        return () => window.clearInterval(interval);
    }, [job?.created_at]);

    // Auto-redirect on completion
    useEffect(() => {
        if (!job || job.status !== "COMPLETED" || redirectedRef.current) return;

        const payload = job.result_payload as Record<string, unknown> | undefined;
        const sourceId = payload?.sourceId ?? payload?.source_id;

        if (sourceId) {
            redirectedRef.current = true;
            const timer = window.setTimeout(() => {
                navigate(`/admin/books/${sourceId}`);
            }, 1500);
            return () => window.clearTimeout(timer);
        }
    }, [job, navigate]);

    const progress = job?.progress_percent ?? 0;
    const isActive = !job || job.status === "PENDING" || job.status === "RUNNING";

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader
                badge={
                    <Link
                        to="/admin/books"
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85 border border-white/15 hover:bg-white/15"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Book Library
                    </Link>
                }
                title="Book Ingestion"
                description={`Job #${jobId}`}
            />

            <div className="max-w-2xl space-y-5">
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-5">
                    {/* Status badge + elapsed */}
                    <div className="flex items-center justify-between">
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[job?.status ?? "PENDING"] ?? statusBadge.PENDING}`}
                        >
                            {job?.status ?? "PENDING"}
                        </span>
                        {elapsed && (
                            <span className="text-xs text-slate-500">Elapsed: {elapsed}</span>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 font-medium">Progress</span>
                            <span className="text-slate-500">{progress}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Current step */}
                    {job?.current_step && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            {isActive && <Loader2 className="w-4 h-4 animate-spin text-brand" />}
                            <span>{job.current_step}</span>
                        </div>
                    )}

                    {/* Completed state */}
                    {job?.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            Ingestion complete. Redirecting to book detail...
                        </div>
                    )}

                    {/* Failed state */}
                    {job?.status === "FAILED" && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                                Ingestion failed.
                                {job.current_step && (
                                    <span className="ml-1">Last step: {job.current_step}</span>
                                )}
                            </div>
                            <Link
                                to="/admin/books"
                                className="inline-flex items-center gap-1 text-sm text-brand font-medium hover:underline"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Book Library
                            </Link>
                        </div>
                    )}

                    {/* Fetch error */}
                    {error && !job && (
                        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Loading spinner when no data yet */}
                    {!job && !error && (
                        <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading job status...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookIngestProgressPage;
