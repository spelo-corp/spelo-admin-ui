import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    X,
    Loader2,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Clock,
    RefreshCcw,
    ListPlus,
} from "lucide-react";
import { api } from "../../api/client";
import type { VocabJob, VocabJobItem } from "../../types/vocabJob";

interface Props {
    show: boolean;
    onClose: () => void;
}

const presets = [
    { label: "Daily life", words: ["appointment", "insurance", "grocery", "elevator"] },
    { label: "Travel", words: ["boarding pass", "layover", "immigration", "currency exchange"] },
    { label: "Work", words: ["stakeholder", "milestone", "retrospective", "backlog"] },
];

const statusStyles = {
    PENDING: "border-amber-100 bg-amber-50 text-amber-700",
    RUNNING: "border-brand/40 bg-brand/10 text-brand",
    SUCCESS: "border-emerald-100 bg-emerald-50 text-emerald-700",
    FAILED: "border-rose-100 bg-rose-50 text-rose-700",
    COMPLETED: "border-emerald-100 bg-emerald-50 text-emerald-700",
    PARTIAL: "border-amber-100 bg-amber-50 text-amber-700",
    WAITING_FOR_INPUT: "border-violet-100 bg-violet-50 text-violet-700",
    REVIEWING: "border-indigo-100 bg-indigo-50 text-indigo-700",
};

const VocabAutoCreateSection: React.FC<Props> = ({ show, onClose }) => {
    const [inputWords, setInputWords] = useState("");
    const [jobId, setJobId] = useState<number | null>(null);
    const [job, setJob] = useState<VocabJob | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wordsCount = useMemo(
        () => inputWords.split("\n").map((w) => w.trim()).filter(Boolean).length,
        [inputWords]
    );

    const submitWords = async () => {
        const words = inputWords.split("\n").map((w) => w.trim()).filter(Boolean);
        if (words.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const res = await api.autoCreateVocab({ words });
            if (res.success) {
                setJobId(res.data);
                setJob(null);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to start auto-create job.");
        }

        setLoading(false);
    };

    const fetchJobStatus = useCallback(
        async (id: number) => {
            try {
                const res = await api.getVocabJob(id);
                if (res.success) {
                    const jobData = res.data;
                    setJob(jobData);
                    return ["COMPLETED", "FAILED", "PARTIAL"].includes(jobData.status);
                }
            } catch {
                setError("Failed to fetch job status");
            }
            return false;
        },
        []
    );

    useEffect(() => {
        if (!jobId) return;

        void fetchJobStatus(jobId);
        const interval = setInterval(async () => {
            const finished = await fetchJobStatus(jobId);
            if (finished) clearInterval(interval);
        }, 1600);

        return () => clearInterval(interval);
    }, [fetchJobStatus, jobId]);

    if (!show) return null;

    const progress =
        job && job.total_words > 0
            ? Math.floor((job.completed_words / job.total_words) * 100)
            : 0;

    const resetFlow = () => {
        setJobId(null);
        setJob(null);
        setInputWords("");
        setError(null);
    };

    const renderItemStatus = (status: VocabJobItem["status"]) => {
        if (status === "RUNNING") {
            return (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyles.RUNNING}`}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Running
                </span>
            );
        }

        if (status === "SUCCESS") {
            return (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyles.SUCCESS}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Created
                </span>
            );
        }

        if (status === "FAILED") {
            return (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyles.FAILED}`}>
                    <AlertCircle className="h-3.5 w-3.5" />
                    Failed
                </span>
            );
        }

        return (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyles.PENDING}`}>
                <Clock className="h-3.5 w-3.5" />
                Pending
            </span>
        );
    };

    const renderJobBadge = (status: VocabJob["status"]) => {
        let text: string = status;
        if (status === "PENDING") text = "Queued";
        if (status === "RUNNING") text = "Running";
        if (status === "COMPLETED") text = "Completed";
        if (status === "FAILED") text = "Failed";
        if (status === "PARTIAL") text = "Partial";

        const statusClass = statusStyles[status] ?? statusStyles.PENDING;
        const Icon =
            status === "COMPLETED"
                ? CheckCircle2
                : status === "FAILED"
                    ? AlertCircle
                    : status === "RUNNING"
                        ? Loader2
                        : Clock;

        return (
            <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass}`}
            >
                <Icon className={`h-4 w-4 ${status === "RUNNING" ? "animate-spin" : ""}`} />
                {text}
            </span>
        );
    };

    return (
        <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[520px] overflow-y-auto border-l border-slate-100 bg-white/95 shadow-2xl backdrop-blur animate-slideIn">
            <header className="relative overflow-hidden border-b border-slate-100 px-6 py-5">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-slate-100" />
                <div className="relative flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                            AI assistant
                        </p>
                        <h2 className="text-2xl font-semibold text-slate-900">Auto Create Vocabulary</h2>
                        <p className="text-sm text-slate-500">
                            Paste a list of words. We will generate pronunciations, translations, and examples.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <div className="space-y-4 px-6 pb-8 pt-4">
                {!jobId && (
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-800">
                            Enter words (one per line)
                        </label>
                        <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-inner shadow-slate-100 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                            <textarea
                                placeholder={`apple\nrun\nbeautiful\n...`}
                                className="h-48 w-full resize-none bg-transparent text-sm text-slate-800 outline-none"
                                value={inputWords}
                                onChange={(e) => setInputWords(e.target.value)}
                            />
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                    <ListPlus className="h-3.5 w-3.5" />
                                    Use one word per line
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                    {wordsCount} word{wordsCount === 1 ? "" : "s"} queued
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        setInputWords((prev) => {
                                            const existing = prev.trim() ? `${prev.trim()}\n` : "";
                                            return `${existing}${preset.words.join("\n")}`;
                                        });
                                    }}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                                >
                                    + {preset.label}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={submitWords}
                            disabled={loading || inputWords.trim() === ""}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                            {loading ? "Starting..." : "Start auto create"}
                        </button>
                    </div>
                )}

                {jobId && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Job</p>
                                <h3 className="text-lg font-semibold text-slate-900">#{jobId}</h3>
                            </div>
                            {job?.status && renderJobBadge(job.status)}
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-card">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-800">Progress</span>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>
                                        {job?.completed_words ?? 0}/{job?.total_words ?? 0} words
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                                        {progress}%
                                    </span>
                                </div>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                    style={{ width: `${progress}%` }}
                                    className="h-2 rounded-full bg-gradient-to-r from-brand via-emerald-400 to-emerald-500 transition-all"
                                />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                <span>Started: {job?.created_at ? new Date(job.created_at).toLocaleString() : "--"}</span>
                                <span>
                                    {job?.status === "COMPLETED" ? "Completed" : "Updating"}:{" "}
                                    {job?.updated_at ? new Date(job.updated_at).toLocaleTimeString() : "--"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-3 text-sm text-slate-600">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                    Success: {job?.completed_words ?? 0}
                                </span>
                                <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                                    Failed: {job?.failed_words ?? 0}
                                </span>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!jobId) return;
                                    setRefreshing(true);
                                    await fetchJobStatus(jobId);
                                    setRefreshing(false);
                                }}
                                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                            >
                                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            {job?.items?.map((item: VocabJobItem) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-brand/40 hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{item.word}</p>
                                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                                {item.status}
                                            </p>
                                            {item.error_message && (
                                                <p className="mt-1 text-[12px] text-rose-600">{item.error_message}</p>
                                            )}
                                        </div>
                                        {renderItemStatus(item.status)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {job?.status === "COMPLETED" && (
                            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
                                <p className="text-sm font-semibold text-emerald-700">All words created!</p>
                                <div className="mt-2 flex items-center justify-center gap-3">
                                    <button
                                        onClick={resetFlow}
                                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        Create another batch
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {job?.status === "FAILED" && (
                            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-center">
                                <p className="text-sm font-semibold text-rose-700">
                                    Job ended with failures. You can try again.
                                </p>
                                <div className="mt-2 flex items-center justify-center gap-3">
                                    <button
                                        onClick={resetFlow}
                                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700"
                                    >
                                        Start over
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VocabAutoCreateSection;
