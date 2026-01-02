// src/pages/AudioReviewPage.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { ProcessingJobDetail, Sentence } from "../types";

import {
    ArrowLeft,
    Play,
    CheckCircle2,
    Lock,
    Unlock,
    Scissors,
    Combine,
    Plus,
} from "lucide-react";

import type WaveSurfer from "wavesurfer.js";
import { WaveformRegionsPlayer } from "../components/audio/WaveformRegionsPlayer";
import { usePresignedAudioUrl } from "../hooks/usePresignedAudioUrl";
import PageHeader from "../components/common/PageHeader";
import { Btn } from "../components/ui/Btn";

interface UISentence extends Sentence {
    locked?: boolean;
}

const AudioReviewPage: React.FC = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [job, setJob] = useState<(ProcessingJobDetail & { sentences: UISentence[] }) | null>(null);

    // For merge mode
    const [mergeSelection, setMergeSelection] = useState<number[]>([]);

    const wsRef = useRef<WaveSurfer | null>(null);

    // Fetch presigned URL for the audio
    const { url: presignedAudioUrl, loading: loadingAudioUrl } = usePresignedAudioUrl(job?.audio_url);

    // ---------------- LOAD JOB ----------------
    useEffect(() => {
        if (!jobId) return;

        (async () => {
            setLoading(true);
            try {
                const res = await api.getJobDetail(Number(jobId));
                if (res.success) {
                    // Add locked flag
                    const withLocks: ProcessingJobDetail = {
                        ...res.job,
                        sentences: res.job.sentences.map((s) => ({
                            ...s,
                            locked: false,
                        })),
                    };
                    setJob(withLocks);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [jobId]);

    // ---------------- HELPERS ----------------
    const playSegment = (start: number, end: number) => {
        wsRef.current?.play(start, end);
    };

    const updateSentence = async (
        index: number,
        field: "text" | "translated_text",
        value: string,
    ) => {
        if (!jobId || !job) return;

        await api.updateSentence(Number(jobId), index, {
            text: field === "text" ? value : job.sentences[index].text,
            translated_text:
                field === "translated_text"
                    ? value
                    : job.sentences[index].translated_text,
        });

        setJob((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, sentences: [...prev.sentences] };
            updated.sentences[index] = {
                ...updated.sentences[index],
                [field]: value,
            };
            return updated;
        });
    };

    const handleApproveAudio = async () => {
        if (!jobId) return;
        setApproving(true);
        try {
            const res = await api.uploadProcessedAudio(Number(jobId));
            if (res.success) {
                alert(`Audio approved! Job ID`);
                navigate("/admin/processing-jobs");
            }
        } finally {
            setApproving(false);
        }
    };

    // ---------------- REGION UPDATES ----------------
    const handleRegionUpdate = (id: string, start: number, end: number) => {
        const idx = Number(id);
        if (Number.isNaN(idx) || !job) return;

        // Prevent updates on locked segments
        if (job.sentences[idx].locked) return;

        setJob((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, sentences: [...prev.sentences] };
            updated.sentences[idx] = {
                ...updated.sentences[idx],
                start_time: start,
                end_time: end,
            };
            return updated;
        });
    };

    // ---------------- ADD NEW SEGMENT ----------------
    const addNewSegment = () => {
        setJob((prev) => {
            if (!prev) return prev;

            const last = prev.sentences[prev.sentences.length - 1];
            const start = last ? last.end_time : 0;
            const end = start + 2;

            const newSentence: UISentence = {
                index: prev.sentences.length,
                text: "",
                translated_text: "",
                start_time: start,
                end_time: end,
                accuracy: undefined,
                locked: false,
            };

            return {
                ...prev,
                sentences: [...prev.sentences, newSentence],
            };
        });
    };

    // ---------------- SPLIT SEGMENT ----------------
    const splitSegment = (index: number) => {
        if (!job) return;
        const s = job.sentences[index];

        if (s.locked) {
            alert("Cannot split: Segment is locked.");
            return;
        }

        const mid = (s.start_time + s.end_time) / 2;

        const s1 = { ...s, end_time: mid };
        const s2: Sentence & { locked?: boolean } = {
            ...s,
            start_time: mid,
            end_time: s.end_time,
            text: "",
            translated_text: "",
            locked: false,
        };

        const newList = [...job.sentences];
        newList.splice(index, 1, s1, s2);

        // Re-index
        newList.forEach((seg, i) => (seg.index = i));

        setJob({ ...job, sentences: newList });
    };

    // ---------------- MERGE SEGMENTS ----------------
    const toggleMergeSelect = (index: number) => {
        setMergeSelection((prev) => {
            if (prev.includes(index)) return prev.filter((i) => i !== index);
            return prev.length < 2 ? [...prev, index] : prev;
        });
    };

    const mergeSegments = () => {
        if (!job) return;
        if (mergeSelection.length !== 2) return;

        const [i1, i2] = mergeSelection.sort((a, b) => a - b);

        const s1 = job.sentences[i1];
        const s2 = job.sentences[i2];

        if (s1.locked || s2.locked) {
            alert("Cannot merge: one or both segments are locked.");
            return;
        }

        const merged: Sentence & { locked?: boolean } = {
            ...s1,
            end_time: s2.end_time,
            text: s1.text + " " + s2.text,
            translated_text: (s1.translated_text || "") + " " + (s2.translated_text || ""),
            locked: false,
        };

        const newList = [...job.sentences];
        newList.splice(i1, 2, merged);

        // Re-index
        newList.forEach((seg, i) => (seg.index = i));

        setMergeSelection([]);
        setJob({ ...job, sentences: newList });
    };

    // ---------------- LOCK / UNLOCK ----------------
    const toggleLock = (index: number) => {
        setJob((prev) => {
            if (!prev) return prev;

            const updated = { ...prev, sentences: [...prev.sentences] };
            updated.sentences[index] = {
                ...updated.sentences[index],
                locked: !updated.sentences[index].locked,
            };
            return updated;
        });
    };

    // ---------------- SAVE ALIGNMENT ----------------
    const saveAlignment = async () => {
        if (!job || !jobId) return;

        try {
            const updates = job.sentences.map((s) => ({
                index: s.index,
                start_time: s.start_time,
                end_time: s.end_time,
            }));

            await api.updateAllTimings(Number(jobId), { updates });

            alert("Alignment saved!");
        } catch {
            alert("Failed to save alignment.");
        }
    };

    // ---------------- REGIONS ----------------
    const regions = useMemo(
        () =>
            job?.sentences.map((s: UISentence) => ({
                id: String(s.index),
                start: s.start_time,
                end: s.end_time,
                color: s.locked
                    ? "rgba(71,85,105,0.35)"
                    : "rgba(14,165,233,0.22)",
            })) ?? [],
        [job],
    );

    // ---------------- SKELETON ----------------
    const ReviewSkeleton = () => <div>Loading...</div>;

    if (loading) return <ReviewSkeleton />;
    if (!job) return <div>Job not found.</div>;

    return (
        <div className="space-y-8 px-8 py-6">
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
                title={`Review Job #${jobId ?? ""}`}
                description="Adjust segment timing and transcripts before approving the final audio."
                actions={
                    <Btn.HeroPrimary disabled={approving} onClick={handleApproveAudio}>
                        <CheckCircle2 className="w-4 h-4" />
                        {approving ? "Approving…" : "Approve Audio"}
                    </Btn.HeroPrimary>
                }
            />

            {/* CONTROLS */}
            <div className="flex gap-3">
                <button
                    onClick={addNewSegment}
                    className="px-3 py-2 rounded-lg bg-purple-500 text-white text-xs flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> Add Segment
                </button>

                <button
                    onClick={saveAlignment}
                    className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs"
                >
                    Save Alignment
                </button>

                <button
                    disabled={mergeSelection.length !== 2}
                    onClick={mergeSegments}
                    className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs disabled:opacity-40 flex items-center gap-1"
                >
                    <Combine className="w-4 h-4" /> Merge Selected
                </button>
            </div>

            {/* WAVEFORM */}
            {loadingAudioUrl ? (
                <div className="flex items-center justify-center h-24 text-slate-500">
                    Loading audio...
                </div>
            ) : presignedAudioUrl ? (
                <WaveformRegionsPlayer
                    audioUrl={presignedAudioUrl}
                    regions={regions}
                    onRegionUpdate={handleRegionUpdate}
                    onReady={(ws) => (wsRef.current = ws)}
                />
            ) : (
                <div className="flex items-center justify-center h-24 text-slate-500">
                    Audio not available.
                </div>
            )}

            {/* SENTENCE LIST */}
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {job.sentences.map((s: UISentence, idx) => {
                    const duration = s.end_time - s.start_time;

                    return (
                        <div
                            key={idx}
                            className="border rounded-xl p-3 bg-slate-50 space-y-2"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">Sentence {idx + 1}</span>
                                <span className="text-slate-500">
                                    {s.start_time.toFixed(2)}s → {s.end_time.toFixed(2)}s •{" "}
                                    {duration.toFixed(2)}s
                                </span>
                            </div>

                            {/* Action Row */}
                            <div className="flex gap-2">
                                {/* Play */}
                                <button
                                    onClick={() => playSegment(s.start_time, s.end_time)}
                                    className="
                                        px-3 py-1 border rounded-lg text-xs flex items-center gap-1 cursor-pointer
                                        transition-all duration-150
                                        hover:bg-slate-100 hover:border-slate-300
                                        active:scale-[0.97]
                                    "
                                >
                                    <Play className="w-4 h-4" /> Play
                                </button>

                                {/* Split */}
                                <button
                                    onClick={() => splitSegment(idx)}
                                    className="
                                        px-3 py-1 border rounded-lg text-xs flex items-center gap-1 cursor-pointer
                                        transition-all duration-150
                                        hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600
                                        active:scale-[0.97]
                                    "
                                >
                                    <Scissors className="w-4 h-4" /> Split
                                </button>

                                {/* Select for merge */}
                                <button
                                    onClick={() => toggleMergeSelect(idx)}
                                    className={`
                                        px-3 py-1 border rounded-lg text-xs cursor-pointer
                                        transition-all duration-150 active:scale-[0.97]
                                        ${mergeSelection.includes(idx)
                                            ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                                            : "hover:bg-indigo-50 hover:border-indigo-200"}
                                        `}
                                >
                                    Select
                                </button>

                                {/* Lock */}
                                <button
                                    onClick={() => toggleLock(idx)}
                                    className="
                                        px-3 py-1 border rounded-lg text-xs flex items-center gap-1 cursor-pointer
                                        transition-all duration-150 active:scale-[0.97]
                                        hover:bg-slate-100 hover:border-slate-300
                                    "
                                >
                                    {s.locked ? (
                                        <>
                                            <Lock className="w-4 h-4 text-slate-700" /> Locked
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className="w-4 h-4 text-slate-500" /> Lock
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* TEXT FIELDS */}
                            <div className="grid md:grid-cols-2 gap-3">
                                <textarea
                                    defaultValue={s.text}
                                    rows={2}
                                    className="border rounded-xl p-2 text-sm"
                                    onBlur={(e) =>
                                        updateSentence(idx, "text", e.target.value)
                                    }
                                />

                                <textarea
                                    defaultValue={s.translated_text || ""}
                                    rows={2}
                                    className="border rounded-xl p-2 text-sm"
                                    onBlur={(e) =>
                                        updateSentence(idx, "translated_text", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AudioReviewPage;
