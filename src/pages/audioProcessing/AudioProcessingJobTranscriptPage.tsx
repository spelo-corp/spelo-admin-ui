import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { Btn } from "../../components/ui/Btn";
import type { AudioProcessingJobOutletContext } from "./AudioProcessingJobPage";

const AudioProcessingJobTranscriptPage: React.FC = () => {
    const { job, transcriptDraft, setTranscriptDraft, readOnly, setJob } =
        useOutletContext<AudioProcessingJobOutletContext>();

    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    const transcriptDirty = transcriptDraft !== (job.transcript ?? "");

    const handleSave = async () => {
        if (readOnly) return;
        const trimmed = transcriptDraft.trim();
        if (!trimmed) {
            setStatus({ type: "error", message: "Transcript is required." });
            return;
        }

        setSaving(true);
        setStatus({ type: null, message: "" });
        try {
            await api.uploadAudioProcessingTranscript({
                jobId: job.id,
                transcript: trimmed,
            });
            setJob((prev) => (prev ? { ...prev, transcript: trimmed } : prev));
            setTranscriptDraft(trimmed);
            setStatus({ type: "success", message: "Transcript updated." });
        } catch (err: unknown) {
            setStatus({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to update transcript.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">Transcript</h3>
                        <p className="text-xs text-slate-500">
                            Update the full transcript for this job. Submit the job to re-run processing.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">{transcriptDraft.trim().length} chars</span>
                        <Btn.Secondary
                            type="button"
                            onClick={() => {
                                setTranscriptDraft(job.transcript ?? "");
                                setStatus({ type: null, message: "" });
                            }}
                            disabled={readOnly || saving || !transcriptDirty}
                        >
                            Reset
                        </Btn.Secondary>
                        <Btn.Primary
                            type="button"
                            onClick={handleSave}
                            disabled={readOnly || saving || !transcriptDirty}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Transcript
                                </>
                            )}
                        </Btn.Primary>
                    </div>
                </div>

                <textarea
                    value={transcriptDraft}
                    onChange={(e) => {
                        setTranscriptDraft(e.target.value);
                        if (status.type) setStatus({ type: null, message: "" });
                    }}
                    rows={10}
                    disabled={readOnly}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[260px]"
                    placeholder="Paste or edit the job transcript…"
                />

                {status.type && (
                    <div
                        className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                            status.type === "success"
                                ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                                : "text-rose-700 bg-rose-50 border-rose-100"
                        }`}
                    >
                        {status.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            <AlertTriangle className="w-4 h-4" />
                        )}
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioProcessingJobTranscriptPage;

