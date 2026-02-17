import React, { useRef, useState, useEffect } from "react";
import { Loader2, Play, Save } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { Btn } from "../../components/ui/Btn";
import type { YoutubeJobOutletContext } from "./YoutubeJobPage";
import { YouTubePlayer, type YouTubePlayerRef } from "../../components/common/YouTubePlayer";
import type { AudioSentence } from "../../types/audioProcessing";

const formatSeconds = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
};

const YoutubeJobSentencesPage: React.FC = () => {
    const { job, sentences, setSentences, readOnly, setError, setJob } =
        useOutletContext<YoutubeJobOutletContext>();

    const playerRef = useRef<YouTubePlayerRef>(null);
    const stopTimeRef = useRef<number | null>(null);
    const [activeSentence, setActiveSentence] = useState<number | null>(null);
    const [selectedSentenceIndexes, setSelectedSentenceIndexes] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // Sync active sentence with video time
    useEffect(() => {
        if (!isPlayerReady) return;

        const interval = setInterval(() => {
            if (playerRef.current) {
                const currentTime = playerRef.current.getCurrentTime();

                // Auto-stop logic for single sentence playback
                if (stopTimeRef.current !== null && currentTime >= stopTimeRef.current) {
                    playerRef.current.pauseVideo();
                    stopTimeRef.current = null;
                }

                // Update active sentence highlight
                const idx = sentences.findIndex((s) => currentTime >= s.start && currentTime <= s.end);
                setActiveSentence(idx === -1 ? null : idx);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [isPlayerReady, sentences]);

    const handlePlaySentence = (sentence: AudioSentence, index: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(sentence.start, true);
            playerRef.current.playVideo();
            stopTimeRef.current = sentence.end;
            setActiveSentence(index);
        }
    };

    const toggleSentenceSelection = (index: number) => {
        setSelectedSentenceIndexes((prev) => {
            if (prev.includes(index)) {
                return prev.filter((i) => i !== index);
            }
            return [...prev, index].sort((a, b) => a - b);
        });
    };

    const clearSentenceSelection = () => {
        setSelectedSentenceIndexes([]);
    };

    const mergeSelectedSentences = () => {
        if (readOnly) return;
        setError(null);

        if (selectedSentenceIndexes.length < 2) {
            setError("Select at least two adjacent sentences to merge.");
            return;
        }

        const sortedIndexes = [...new Set(selectedSentenceIndexes)].sort((a, b) => a - b);
        const areConsecutive = sortedIndexes.every((idx, i) =>
            i === 0 ? true : idx === sortedIndexes[i - 1] + 1
        );

        if (!areConsecutive) {
            setError("Please select consecutive sentences to merge.");
            return;
        }

        const selectedSentences = sortedIndexes
            .map((idx) => sentences[idx])
            .filter(Boolean);

        if (selectedSentences.length < 2) {
            setError("Selected sentences are not available to merge.");
            return;
        }

        const start = Math.min(...selectedSentences.map((s) => s.start));
        const end = Math.max(...selectedSentences.map((s) => s.end));
        const mergedText = selectedSentences
            .map((s) => s.text.trim())
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

        const mergedSentence: AudioSentence = {
            text: mergedText || selectedSentences[0].text,
            start,
            end,
        };

        setSentences((prev) => {
            const next = prev.filter((_, idx) => !sortedIndexes.includes(idx));
            next.splice(sortedIndexes[0], 0, mergedSentence);
            return next;
        });

        setActiveSentence(sortedIndexes[0]);
        setSelectedSentenceIndexes([]);
        stopTimeRef.current = null; // Clear stop time to avoid unwanted pauses after merge
    };

    const handleSave = async () => {
        const hasInvalidTimes = sentences.some((s) => s.end <= s.start);
        if (hasInvalidTimes) {
            setError("End time must be greater than start time for every sentence.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await api.updateAudioProcessingSentences(job.id, sentences);
            setJob((prev) => (prev ? { ...prev, sentences } : prev));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save sentences.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">Video Player</h3>
                    <p className="text-xs text-slate-500">
                        Use play to verify sentence boundaries.
                    </p>
                </div>
                {job.youtubeVideoId ? (
                    <div className="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-black">
                        <YouTubePlayer
                            ref={playerRef}
                            videoId={job.youtubeVideoId}
                            onReady={() => setIsPlayerReady(true)}
                            width="100%"
                            height="100%"
                            className="w-full h-full"
                        />
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 py-4 text-center">
                        No YouTube video ID associated with this job.
                    </div>
                )}
            </div>

            <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Sentences ({sentences.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                            {selectedSentenceIndexes.length} selected for merge.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Btn.Secondary
                            onClick={mergeSelectedSentences}
                            disabled={readOnly || selectedSentenceIndexes.length < 2}
                        >
                            Merge Selected
                        </Btn.Secondary>
                        <button
                            type="button"
                            onClick={clearSentenceSelection}
                            disabled={readOnly || selectedSentenceIndexes.length === 0}
                            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-60"
                        >
                            Clear selection
                        </button>
                        <Btn.Primary onClick={handleSave} disabled={saving || readOnly}>
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </Btn.Primary>
                    </div>
                </div>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {sentences.map((sentence, index) => {
                        const duration = sentence.end - sentence.start;
                        const isActive = activeSentence === index;
                        const isSelected = selectedSentenceIndexes.includes(index);

                        return (
                            <div
                                key={`${sentence.start}-${index}`}
                                className={`
                                    border rounded-xl p-3 space-y-2
                                    ${isActive
                                        ? "border-brand bg-brand-soft/60"
                                        : isSelected
                                            ? "border-sky-200 bg-sky-50"
                                            : "border-slate-200 bg-slate-50"}
                                `}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-1 text-slate-500">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSentenceSelection(index)}
                                                disabled={readOnly}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30"
                                            />
                                            Merge
                                        </label>
                                        <span className="font-semibold text-slate-900">
                                            Sentence {index + 1}
                                        </span>
                                    </div>
                                    <span className="text-slate-500">
                                        {formatSeconds(sentence.start)} → {formatSeconds(sentence.end)} •{" "}
                                        {duration.toFixed(2)}s
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <button
                                        onClick={() => handlePlaySentence(sentence, index)}
                                        className="px-3 py-1 rounded-full border border-slate-300 text-slate-700 flex items-center gap-1 hover:bg-slate-100"
                                        type="button"
                                        disabled={!isPlayerReady}
                                    >
                                        <Play className="w-3 h-3" /> Play
                                    </button>

                                    <label className="flex items-center gap-1 text-slate-500">
                                        Start
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={sentence.start}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setSentences((prev) => {
                                                    const next = [...prev];
                                                    next[index] = { ...next[index], start: value };
                                                    return next;
                                                });
                                            }}
                                            disabled={readOnly}
                                            className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </label>

                                    <label className="flex items-center gap-1 text-slate-500">
                                        End
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={sentence.end}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setSentences((prev) => {
                                                    const next = [...prev];
                                                    next[index] = { ...next[index], end: value };
                                                    return next;
                                                });
                                            }}
                                            disabled={readOnly}
                                            className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </label>
                                </div>

                                <textarea
                                    value={sentence.text}
                                    onChange={(e) =>
                                        setSentences((prev) => {
                                            const next = [...prev];
                                            next[index] = { ...next[index], text: e.target.value };
                                            return next;
                                        })
                                    }
                                    rows={2}
                                    disabled={readOnly}
                                    className="w-full border border-slate-200 rounded-xl p-2 text-sm"
                                />
                            </div>
                        );
                    })}

                    {sentences.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            No sentences available yet. If the job is still processing, try refreshing.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YoutubeJobSentencesPage;
