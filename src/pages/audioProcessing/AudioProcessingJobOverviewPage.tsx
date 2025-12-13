import React, { useMemo } from "react";
import { Clock } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { StatusBadge } from "../../components/audioProcessing/StatusBadge";
import type { AudioProcessingJobOutletContext } from "./AudioProcessingJobPage";

const AudioProcessingJobOverviewPage: React.FC = () => {
    const { job, sentences } = useOutletContext<AudioProcessingJobOutletContext>();

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
                        <audio controls src={job.audioUrl} className="w-full rounded-xl overflow-hidden" />
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
                </div>
            </div>
        </div>
    );
};

export default AudioProcessingJobOverviewPage;

