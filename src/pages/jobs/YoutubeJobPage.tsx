import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { api } from "../../api/client";
import type { AudioJob, AudioSentence } from "../../types/audioProcessing";
import { StatusBadge } from "../../components/audioProcessing/StatusBadge";
import { Btn } from "../../components/ui/Btn";
import PageHeader from "../../components/common/PageHeader";

export interface YoutubeJobOutletContext {
    job: AudioJob;
    sentences: AudioSentence[];
    setSentences: React.Dispatch<React.SetStateAction<AudioSentence[]>>;
    readOnly: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    reloadJob: (options?: { silent?: boolean; preserveError?: boolean }) => Promise<void>;
    setJob: React.Dispatch<React.SetStateAction<AudioJob | null>>;
}

const POLL_STATUSES: AudioJob["status"][] = ["PROCESSING", "PENDING", "REPROCESSING", "RUNNING"];

const YoutubeJobPage: React.FC = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState<AudioJob | null>(null);
    const [sentences, setSentences] = useState<AudioSentence[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [finalizeStatus, setFinalizeStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });
    const [error, setError] = useState<string | null>(null);

    const readOnly = job?.status === "FINALIZED";

    const loadJob = useCallback(
        async (options?: { silent?: boolean; preserveError?: boolean }) => {
            if (!jobId) return;
            if (!options?.preserveError) setError(null);
            if (!options?.silent) setLoading(true);

            try {
                const res = await api.getAudioProcessingJob(Number(jobId));
                const data =
                    (res as { data?: AudioJob }).data ??
                    (res as { job?: AudioJob }).job ??
                    (res as AudioJob | null);

                setJob(data);
                setSentences(data?.sentences ?? []);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load job.");
            } finally {
                if (!options?.silent) setLoading(false);
            }
        },
        [jobId]
    );

    useEffect(() => {
        void loadJob();
    }, [loadJob]);

    useEffect(() => {
        setFinalizeStatus({ type: null, message: "" });
    }, [jobId]);

    useEffect(() => {
        if (!jobId || !job) return;
        if (!POLL_STATUSES.includes(job.status)) return;

        const interval = window.setInterval(() => {
            void loadJob({ silent: true, preserveError: true });
        }, 4000);

        return () => window.clearInterval(interval);
    }, [jobId, job?.status, loadJob]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadJob({ silent: true });
        setRefreshing(false);
    };

    const handleFinalize = async () => {
        if (!job || readOnly) return;

        setFinalizeStatus({ type: null, message: "" });
        setError(null);

        if (job.status !== "COMPLETED" && job.status !== "REVIEWING") {
            setFinalizeStatus({ type: "error", message: "Job must be COMPLETED or REVIEWING before finalizing." });
            return;
        }

        if ((job.sentences ?? []).length === 0) {
            setFinalizeStatus({ type: "error", message: "No sentences found." });
            return;
        }

        setFinalizing(true);
        try {
            const res = await api.finalizeYouTubeJob(job.id);
            const success =
                (res as { success?: boolean }).success ??
                ((res as { status?: string }).status ? (res as { status?: string }).status === "success" : true);

            if (!success) {
                const message = (res as { message?: string }).message;
                throw new Error(message || "Finalization failed.");
            }

            setFinalizeStatus({ type: "success", message: "Finalized successfully." });
            await loadJob({ silent: true, preserveError: true });
            navigate(`/admin/lessons/${job.lessonId}/audio`);
        } catch (err: unknown) {
            setFinalizeStatus({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to finalize.",
            });
        } finally {
            setFinalizing(false);
        }
    };

    const tabs = useMemo(
        () => [
            { label: "Overview", path: "overview" },
            { label: "Sentences", path: "sentences" },
        ],
        []
    );

    if (loading) {
        return (
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6 flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading job...
            </div>
        );
    }

    if (!job) {
        return (
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                <p className="text-slate-700">Job not found.</p>
                <Link to="/admin/jobs" className="text-brand hover:underline text-sm">
                    Back to Jobs
                </Link>
            </div>
        );
    }

    const showFinalize = !readOnly && (job.status === "COMPLETED" || job.status === "REVIEWING");

    return (
        <div className="flex flex-col h-full gap-8 px-8 py-6">
            <PageHeader
                badge={
                    <button
                        onClick={() => navigate("/admin/jobs")}
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85 border border-white/15 hover:bg-white/15"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Jobs
                    </button>
                }
                title={`YouTube Job #${job.id}`}
                titleAddon={<StatusBadge status={job.status} />}
                description="YouTube alignment job details."
                actions={
                    <>
                        <Btn.HeroSecondary onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Btn.HeroSecondary>
                        {showFinalize && (
                            <Btn.HeroPrimary onClick={handleFinalize} disabled={finalizing}>
                                {finalizing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Finalizing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Finalize Job
                                    </>
                                )}
                            </Btn.HeroPrimary>
                        )}
                    </>
                }
            >
                {error ? (
                    <div className="flex items-center gap-2 text-sm text-rose-50 bg-rose-500/15 border border-rose-300/25 px-4 py-3 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-rose-100" />
                        {error}
                    </div>
                ) : null}
                {finalizeStatus.type ? (
                    <div
                        className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${finalizeStatus.type === "success"
                            ? "text-emerald-50 bg-emerald-500/15 border-emerald-300/25"
                            : "text-rose-50 bg-rose-500/15 border-rose-300/25"
                            }`}
                    >
                        {finalizeStatus.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-100" />
                        )}
                        {finalizeStatus.message}
                    </div>
                ) : null}
            </PageHeader>

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex-1 flex flex-col">
                <div className="bg-slate-50 border-b border-slate-100">
                    <div className="flex gap-1 px-2">
                        {tabs.map((t) => (
                            <NavLink
                                key={t.path}
                                to={t.path}
                                className={({ isActive }) =>
                                    `
                                        px-4 py-2 text-sm font-medium
                                        rounded-t-xl
                                        transition-all
                                        ${isActive
                                        ? "bg-white border border-slate-200 border-b-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:bg-white"
                                    }
                                    `
                                }
                            >
                                {t.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 flex-1">
                    <Outlet
                        context={
                            {
                                job,
                                sentences,
                                setSentences,
                                readOnly,
                                error,
                                setError,
                                reloadJob: loadJob,
                                setJob,
                            } satisfies YoutubeJobOutletContext
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default YoutubeJobPage;
