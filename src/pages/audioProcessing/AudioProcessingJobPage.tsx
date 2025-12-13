import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { api } from "../../api/client";
import type { AudioJob, AudioSentence } from "../../types/audioProcessing";
import { StatusBadge } from "../../components/audioProcessing/StatusBadge";
import { Btn } from "../../components/ui/Btn";
import PageHeader from "../../components/common/PageHeader";

export interface AudioProcessingJobOutletContext {
    job: AudioJob;
    sentences: AudioSentence[];
    setSentences: React.Dispatch<React.SetStateAction<AudioSentence[]>>;
    transcriptDraft: string;
    setTranscriptDraft: React.Dispatch<React.SetStateAction<string>>;
    readOnly: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    reloadJob: (options?: { silent?: boolean; preserveError?: boolean }) => Promise<void>;
    setJob: React.Dispatch<React.SetStateAction<AudioJob | null>>;
}

interface AudioProcessingJobPageProps {
    mode?: "edit" | "review";
}

const POLL_STATUSES: AudioJob["status"][] = ["PROCESSING", "PENDING", "REPROCESSING", "RUNNING"];

const AudioProcessingJobPage: React.FC<AudioProcessingJobPageProps> = ({ mode = "edit" }) => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState<AudioJob | null>(null);
    const [sentences, setSentences] = useState<AudioSentence[]>([]);
    const [transcriptDraft, setTranscriptDraft] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [finalizeStatus, setFinalizeStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });
    const [error, setError] = useState<string | null>(null);

    const readOnly = mode === "review" || job?.status === "FINALIZED";

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
                setTranscriptDraft(data?.transcript ?? "");
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

    const handleSubmitJob = async () => {
        if (!job || readOnly) return;
        setSubmitting(true);
        setError(null);
        try {
            await api.submitExistingAudioProcessingJob(job.id);
            await loadJob({ silent: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to submit job.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinalizeListening = async () => {
        if (!job || readOnly) return;

        setFinalizeStatus({ type: null, message: "" });
        setError(null);

        if (job.status !== "COMPLETED") {
            setFinalizeStatus({ type: "error", message: "Job must be COMPLETED before finalizing." });
            return;
        }

        const transcriptDirty = transcriptDraft.trim() !== (job.transcript ?? "").trim();
        const sentencesDirty = JSON.stringify(sentences) !== JSON.stringify(job.sentences ?? []);
        if (transcriptDirty || sentencesDirty) {
            const dirtyParts = [
                transcriptDirty ? "transcript" : null,
                sentencesDirty ? "sentences" : null,
            ].filter(Boolean);
            setFinalizeStatus({
                type: "error",
                message: `You have unsaved ${dirtyParts.join(" & ")} edits. Save them (and submit if needed) before finalizing.`,
            });
            return;
        }

        if (!job.audioUrl) {
            setFinalizeStatus({ type: "error", message: "Audio is not ready yet. Try refreshing." });
            return;
        }

        if ((job.sentences ?? []).length === 0) {
            setFinalizeStatus({ type: "error", message: "No sentences found. Submit the job and wait for processing." });
            return;
        }

        setFinalizing(true);
        try {
            const res = await api.finalizeAudioProcessingJob(job.id);
            const success =
                (res as { success?: boolean }).success ??
                ((res as { status?: string }).status ? (res as { status?: string }).status === "success" : true);

            if (!success) {
                const message = (res as { message?: string }).message;
                throw new Error(message || "Finalization failed.");
            }

            const created = (res as { data?: unknown }).data;
            const createdCount = Array.isArray(created) ? created.length : null;

            setFinalizeStatus({
                type: "success",
                message: createdCount !== null
                    ? `Finalized: created ${createdCount} listening items.`
                    : "Finalized: created listening items.",
            });
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
            { label: "Transcript", path: "transcript" },
            { label: "Sentences", path: "sentences" },
            { label: "Audio Edit", path: "audio" },
        ],
        []
    );

    if (loading) {
        return (
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6 flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading job…
            </div>
        );
    }

    if (!job) {
        return (
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                <p className="text-slate-700">Job not found.</p>
                <Link to="/admin/audio-processing" className="text-brand hover:underline text-sm">
                    Back to dashboard
                </Link>
            </div>
        );
    }

    const disableSubmit =
        readOnly || submitting || POLL_STATUSES.includes(job.status);

    const showFinalize = !readOnly && job.status === "COMPLETED";
    const SubmitButton = showFinalize ? Btn.HeroSecondary : Btn.HeroPrimary;

    return (
        <div className="flex flex-col h-full gap-8">
            <PageHeader
                badge={
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85 border border-white/15 hover:bg-white/15"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                }
                title={`Job #${job.id}`}
                titleAddon={
                    <>
                        <StatusBadge status={job.status} />
                        {mode === "review" && (
                            <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/15 text-white/85 uppercase tracking-wide">
                                Review mode
                            </span>
                        )}
                    </>
                }
                description="Manage transcript alignment and submit for processing when ready."
                actions={
                    <>
                        <Btn.HeroSecondary onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Btn.HeroSecondary>
                        {mode !== "review" && (
                            <>
                                {showFinalize && (
                                    <Btn.HeroPrimary onClick={handleFinalizeListening} disabled={finalizing}>
                                        {finalizing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Finalizing…
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Finalize Listening
                                            </>
                                        )}
                                    </Btn.HeroPrimary>
                                )}
                                <SubmitButton onClick={handleSubmitJob} disabled={disableSubmit}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Submit Job
                                        </>
                                    )}
                                </SubmitButton>
                            </>
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
                        className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
                            finalizeStatus.type === "success"
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
                                        ${
                                            isActive
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
                                transcriptDraft,
                                setTranscriptDraft,
                                readOnly,
                                error,
                                setError,
                                reloadJob: loadJob,
                                setJob,
                            } satisfies AudioProcessingJobOutletContext
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default AudioProcessingJobPage;
