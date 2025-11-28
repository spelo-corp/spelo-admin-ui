import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ProcessingJobDetail } from "../types";

import { ArrowLeft, Play, CheckCircle2 } from "lucide-react";
import { WaveformPlayer } from "../components/audio/WaveformPlayer";
import type WaveSurfer from "wavesurfer.js";

const JobReviewPage: React.FC = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<ProcessingJobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);

    const wsRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!jobId) return;

        (async () => {
            setLoading(true);
            try {
                const res = await api.getJobDetail(Number(jobId));
                if (res.success) setJob(res.job);
            } finally {
                setLoading(false);
            }
        })();
    }, [jobId]);

    const playSegment = (start: number, end: number) => {
        if (!wsRef.current) return;
        wsRef.current.play(start, end);
    };

    const updateSentence = async (
        index: number,
        field: "text" | "translated_text",
        value: string
    ) => {
        if (!job || !jobId) return;

        const old = job.sentences[index];
        const payload = {
            text: field === "text" ? value : old.text,
            translated_text:
                field === "translated_text" ? value : old.translated_text,
        };

        await api.updateSentence(Number(jobId), index, payload);

        const clone = { ...job };
        clone.sentences = [...job.sentences];
        clone.sentences[index] = { ...old, ...payload };
        setJob(clone);
    };

    const handleApprove = async () => {
        if (!jobId) return;
        setApproving(true);

        try {
            const res = await api.approveJob(Number(jobId), 1);
            if (res.success) {
                alert(`Job approved! Listening lesson ID: ${res.listening_lesson_id}`);
                navigate("/admin/processing-jobs");
            }
        } finally {
            setApproving(false);
        }
    };

    // ---------------- SKELETON ----------------
    const ReviewSkeleton = () => (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-10 bg-slate-200 rounded"></div>
                    <div className="h-6 w-64 bg-slate-200 rounded"></div>
                </div>
                <div className="h-9 w-40 bg-slate-200 rounded-xl"></div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="w-full h-10 bg-slate-200 rounded-xl"></div>
                </div>
                <div className="h-3 w-52 bg-slate-200 rounded"></div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="border rounded-2xl p-3 bg-slate-50 space-y-3 border-slate-200"
                        >
                            <div className="flex justify-between">
                                <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                <div className="h-3 w-32 bg-slate-200 rounded"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-16 bg-slate-200 rounded-xl"></div>
                                <div className="h-16 bg-slate-200 rounded-xl"></div>
                            </div>
                            <div className="h-7 w-28 bg-slate-200 rounded-xl"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) return <ReviewSkeleton />;
    if (!job) return <div className="text-sm text-rose-500">Job not found.</div>;

    // ------------ MAIN UI ------------
    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <button
                        className="text-xs text-slate-500 mb-1 flex items-center gap-1"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <h1 className="text-2xl font-semibold text-slate-800">
                        Review Sentences · Job #{job.job_id}
                    </h1>
                </div>

                <button
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm
                               flex items-center gap-2 hover:bg-emerald-600 disabled:opacity-60"
                    disabled={approving}
                    onClick={handleApprove}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Finalize
                </button>
            </div>

            {/* MAIN BOX */}
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
                {/* AUDIO */}
                <div>
                    <h2 className="font-semibold text-slate-800 text-sm mb-2">
                        Original Audio
                    </h2>

                    <WaveformPlayer
                        audioUrl={job.audio_url}
                        onReady={(ws) => (wsRef.current = ws)}
                    />

                    <audio controls className="w-full mt-2" src={job.audio_url} />
                </div>

                <p className="text-xs text-slate-500">
                    Edit sentence text/translation. Click “Play segment” to hear each chunk.
                </p>

                {/* SENTENCES */}
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {job.sentences.map((s, idx) => {
                        const duration = s.end_time - s.start_time;
                        let borderColor = "border-slate-200";

                        const accuracy = s.accuracy;
                        if (typeof accuracy === "number") {
                            if (accuracy >= 0.9) borderColor = "border-emerald-300";
                            else if (accuracy >= 0.7) borderColor = "border-amber-300";
                            else borderColor = "border-rose-300";
                        }

                        return (
                            <div
                                key={idx}
                                className={`border ${borderColor} rounded-2xl p-3 bg-slate-50`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-600">
                                        Sentence {idx + 1}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        {s.start_time.toFixed(2)}s – {s.end_time.toFixed(2)}s • {duration.toFixed(2)}s
                                        {typeof s.accuracy === "number" &&
                                            ` · Accuracy ${(s.accuracy * 100).toFixed(0)}%`}
                                    </span>

                                </div>

                                {/* TEXT AREAS */}
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] text-slate-500 mb-1">
                                            Sentence Text
                                        </label>
                                        <textarea
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            rows={2}
                                            defaultValue={s.text}
                                            onBlur={(e) => updateSentence(idx, "text", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] text-slate-500 mb-1">
                                            Translated Text (optional)
                                        </label>
                                        <textarea
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            rows={2}
                                            defaultValue={s.translated_text || ""}
                                            onBlur={(e) =>
                                                updateSentence(idx, "translated_text", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <button
                                        className="px-3 py-1.5 rounded-xl border text-xs hover:bg-slate-100 flex items-center gap-1"
                                        onClick={() => playSegment(s.start_time, s.end_time)}
                                    >
                                        <Play className="w-4 h-4" />
                                        Play Segment
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default JobReviewPage;
