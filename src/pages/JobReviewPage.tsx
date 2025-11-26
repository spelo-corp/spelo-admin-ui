import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ProcessingJobDetail } from "../types";

const JobReviewPage: React.FC = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<ProcessingJobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        if (!jobId) return;
        (async () => {
            setLoading(true);
            try {
                const res = await api.getJobDetail(Number(jobId));
                if (res.success) {
                    setJob(res.job);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [jobId]);

    const playSegment = (start: number, end: number) => {
        if (!job) return;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = start;
            audioRef.current.play();
            const duration = Math.max(end - start, 0);
            setTimeout(() => {
                if (audioRef.current) audioRef.current.pause();
            }, duration * 1000);
        }
    };

    const updateSentence = async (index: number, field: "text" | "translated_text", value: string) => {
        if (!jobId || !job) return;
        const sentence = job.sentences[index];
        const payload = {
            text: field === "text" ? value : sentence.text,
            translated_text: field === "translated_text" ? value : sentence.translated_text
        };
        await api.updateSentence(Number(jobId), index, payload);
        // local update
        const clone = { ...job };
        clone.sentences = [...job.sentences];
        clone.sentences[index] = { ...sentence, ...payload };
        setJob(clone);
    };

    const handleApprove = async () => {
        if (!jobId) return;
        setApproving(true);
        try {
            // TODO: use real admin user id from auth
            const res = await api.approveJob(Number(jobId), 1);
            if (res.success) {
                alert(`Job approved! Listening lesson ID: ${res.listening_lesson_id}`);
                navigate("/admin/processing-jobs");
            }
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return <div className="text-sm text-slate-500">Loading job...</div>;
    }

    if (!job) {
        return <div className="text-sm text-rose-500">Job not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <button
                        className="text-xs text-slate-500 mb-1"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-semibold text-slate-800">
                        Review Sentences · Job #{job.job_id}
                    </h1>
                </div>
                <button
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm hover:bg-emerald-600 disabled:opacity-60"
                    disabled={approving}
                    onClick={handleApprove}
                >
                    ✅ Approve & Finalize
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
                <div>
                    <h2 className="font-semibold text-slate-800 text-sm mb-2">
                        Original Audio
                    </h2>
                    <audio
                        ref={audioRef}
                        controls
                        className="w-full"
                        src={job.audio_url}
                    />
                </div>

                <p className="text-xs text-slate-500">
                    You can edit the text and translations. Use “Play segment” to listen
                    to each sentence chunk.
                </p>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {job.sentences.map((s, idx) => {
                        const duration = s.end_time - s.start_time;
                        // optional MFA color-coding (placeholder)
                        const accuracy = s.accuracy ?? null;
                        let borderColor = "border-slate-200";
                        if (accuracy !== null) {
                            if (accuracy >= 0.9) borderColor = "border-emerald-300";
                            else if (accuracy >= 0.7) borderColor = "border-amber-300";
                            else borderColor = "border-rose-300";
                        }

                        return (
                            <div
                                key={idx}
                                className={`border ${borderColor} rounded-2xl p-3 bg-slate-50`}
                            >
                                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">
                    Sentence {idx + 1}
                  </span>
                                    <span className="text-[11px] text-slate-500">
                    {s.start_time.toFixed(2)}s – {s.end_time.toFixed(2)}s •{" "}
                                        {duration.toFixed(2)}s
                                        {accuracy !== null && (
                                            <> · Accuracy {(accuracy * 100).toFixed(0)}%</>
                                        )}
                  </span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] text-slate-500 mb-1">
                                            Sentence Text
                                        </label>
                                        <textarea
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            rows={2}
                                            defaultValue={s.text}
                                            onBlur={(e) =>
                                                updateSentence(idx, "text", e.target.value)
                                            }
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
                                        className="px-3 py-1.5 rounded-xl border text-xs hover:bg-slate-100"
                                        onClick={() => playSegment(s.start_time, s.end_time)}
                                    >
                                        ▶️ Play Segment
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
