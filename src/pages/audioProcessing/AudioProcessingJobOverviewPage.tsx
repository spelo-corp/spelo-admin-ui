import React, { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { StatusBadge } from "../../components/audioProcessing/StatusBadge";
import { PresignedAudioPlayer } from "../../components/audio/PresignedAudioPlayer";
import type { AudioProcessingJobOutletContext } from "./AudioProcessingJobPage";
import type { JobServiceStatus } from "../../types/jobService";

function mapAudioStatusToServiceStatus(status: string): JobServiceStatus | null {
    const upper = status.toUpperCase();
    if (upper === "WAITING_FOR_INPUT") return "WAITING_FOR_INPUT";
    if (upper === "READY_TO_PROCESS") return "PENDING";
    if (upper === "PENDING") return "PENDING";
    if (upper === "RUNNING") return "RUNNING";
    if (upper === "PROCESSING") return "RUNNING";
    if (upper === "REPROCESSING") return "RUNNING";
    if (upper === "COMPLETED") return "COMPLETED";
    if (upper === "FINALIZED") return "COMPLETED";
    if (upper === "PARTIAL") return "PARTIAL";
    if (upper === "FAILED") return "FAILED";
    if (upper === "REVIEWING") return "REVIEWING";
    return null;
}

const AudioProcessingJobOverviewPage: React.FC = () => {
    const { job, sentences, readOnly, reloadJob } = useOutletContext<AudioProcessingJobOutletContext>();

    const [overrideStatus, setOverrideStatus] = useState<JobServiceStatus>("RUNNING");
    const [overrideReason, setOverrideReason] = useState("");
    const [overrideLoading, setOverrideLoading] = useState(false);
    const [overrideNotice, setOverrideNotice] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    useEffect(() => {
        const mapped = mapAudioStatusToServiceStatus(job.status);
        if (mapped) setOverrideStatus(mapped);
        setOverrideNotice({ type: null, message: "" });
    }, [job.id, job.status]);

    const handleManualStatusUpdate = async () => {
        if (readOnly) return;

        setOverrideLoading(true);
        setOverrideNotice({ type: null, message: "" });

        try {
            await api.updateJobStatus(job.id, {
                status: overrideStatus,
                reason: overrideReason.trim() ? overrideReason.trim() : undefined,
            });
            setOverrideNotice({ type: "success", message: "Status updated." });
            await reloadJob({ silent: true, preserveError: true });
        } catch (err: unknown) {
            setOverrideNotice({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to update status.",
            });
        } finally {
            setOverrideLoading(false);
        }
    };

    const jobMeta = useMemo(
        () => [
            { label: "Job ID", value: `#${job.id}` },
            {
                label: "Lesson",
                value: job.lessonName
                    ? `${job.lessonName} (${job.lessonId})`
                    : `Lesson ${job.lessonId}`,
            },
            { label: "Created", value: new Date(job.createdAt).toLocaleString() },
            { label: "Updated", value: new Date(job.updatedAt).toLocaleString() },
        ],
        [job]
    );

    return (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 lg:gap-6 items-start">
            <div className="space-y-3 lg:space-y-4">
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Audio</h2>
                            <p className="text-xs text-slate-500">Preview playback to check boundaries.</p>
                        </div>
                        {job.audioUrl ? (
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                Ready
                            </span>
                        ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                Processing
                            </span>
                        )}
                    </div>

                    {job.audioUrl ? (
                        <PresignedAudioPlayer src={job.audioUrl} className="rounded-xl overflow-hidden" />
                    ) : (
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Audio is still processing. Refresh once complete.
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 grid sm:grid-cols-2 gap-3">
                    {jobMeta.map((item) => (
                        <div key={item.label} className="space-y-1">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                                {item.label}
                            </div>
                            <div className="font-semibold text-slate-900 text-sm">{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">Status</h3>
                    <div className="text-sm text-slate-600 space-y-2">
                        <div className="flex items-center justify-between">
                            <span>Current state</span>
                            <StatusBadge status={job.status} />
                        </div>
                        {job.currentStep && (
                            <div className="flex items-center justify-between">
                                <span>Current step</span>
                                <span className="font-semibold text-slate-900">{job.currentStep}</span>
                            </div>
                        )}
                        {job.progressPercent != null && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span>Progress</span>
                                    <span className="font-semibold text-slate-900">{job.progressPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div
                                        className="bg-brand h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${job.progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span>Sentences</span>
                            <span className="font-semibold text-slate-900">{sentences.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Transcript length</span>
                            <span className="font-semibold text-slate-900">
                                {job.transcript?.length ?? 0} chars
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-2 text-sm text-slate-600">
                        <p>Update transcript and sentences, then submit to re-run processing.</p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                            Operational Override
                        </div>
                        <p className="text-xs text-slate-500">
                            Manually correct stuck jobs. Add a reason for the audit log.
                        </p>
                        <div className="grid gap-2">
                            <select
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-60"
                                value={overrideStatus}
                                onChange={(e) => setOverrideStatus(e.target.value as JobServiceStatus)}
                                disabled={readOnly || overrideLoading}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="RUNNING">RUNNING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="PARTIAL">PARTIAL</option>
                                <option value="FAILED">FAILED</option>
                                <option value="WAITING_FOR_INPUT">WAITING FOR INPUT</option>
                                <option value="REVIEWING">REVIEWING</option>
                            </select>
                            <textarea
                                className="w-full min-h-[72px] px-3 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-60"
                                placeholder="Reason (optional, but recommended)"
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                disabled={readOnly || overrideLoading}
                            />
                            <button
                                onClick={handleManualStatusUpdate}
                                disabled={readOnly || overrideLoading}
                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {overrideLoading ? "Updating…" : "Update Status"}
                            </button>
                            {overrideNotice.type ? (
                                <div
                                    className={`text-sm px-3 py-2 rounded-xl border ${overrideNotice.type === "success"
                                        ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                                        : "text-rose-700 bg-rose-50 border-rose-100"
                                        }`}
                                >
                                    {overrideNotice.message}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioProcessingJobOverviewPage;
