import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, Loader2, Play, Save } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { WaveformRegionsPlayer } from "../../components/audio/WaveformRegionsPlayer";
import { Btn } from "../../components/ui/Btn";
import type { AudioSentence } from "../../types/audioProcessing";
import type { AudioProcessingJobOutletContext } from "./AudioProcessingJobPage";

const formatSeconds = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
};

const AudioProcessingJobSentencesPage: React.FC = () => {
    const { job, sentences, setSentences, readOnly, setError, setJob } =
        useOutletContext<AudioProcessingJobOutletContext>();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [activeSentence, setActiveSentence] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            const now = audio.currentTime;
            const idx = sentences.findIndex((s) => now >= s.start && now <= s.end);
            setActiveSentence(idx === -1 ? null : idx);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
    }, [sentences]);

    const handlePlaySentence = (sentence: AudioSentence, index: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = sentence.start;
        const stopTime = sentence.end;

        const stopIfNeeded = () => {
            if (audio.currentTime >= stopTime) {
                audio.pause();
                audio.removeEventListener("timeupdate", stopIfNeeded);
            }
        };

        audio.addEventListener("timeupdate", stopIfNeeded);
        void audio.play();
        setActiveSentence(index);
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

    const waveformRegions = useMemo(
        () =>
            sentences.map((sentence, index) => ({
                id: String(index),
                start: sentence.start,
                end: sentence.end,
                color:
                    activeSentence === index
                        ? "rgba(26,159,109,0.32)"
                        : "rgba(14,165,233,0.24)",
            })),
        [sentences, activeSentence]
    );

    const handleWaveformRegionUpdate = useCallback((id: string, start: number, end: number) => {
        const index = Number(id);
        if (!Number.isFinite(index)) return;

        setSentences((prev) => {
            if (index < 0 || index >= prev.length) return prev;
            const next = [...prev];
            next[index] = {
                ...next[index],
                start: Math.max(0, Number(start.toFixed(3))),
                end: Math.max(0, Number(end.toFixed(3))),
            };
            return next;
        });
    }, [setSentences]);

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Audio Player</h2>
                        <p className="text-xs text-slate-500">Use play to verify sentence boundaries.</p>
                    </div>
                </div>

                {job.audioUrl ? (
                    <audio
                        ref={audioRef}
                        controls
                        src={job.audioUrl}
                        className="w-full rounded-xl overflow-hidden"
                    />
                ) : (
                    <div className="text-sm text-slate-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Audio is still processing. Refresh once complete.
                    </div>
                )}
            </div>

            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">Waveform Boundaries</h3>
                    <p className="text-xs text-slate-500">
                        Drag sentence regions to adjust start/end times, then save changes below.
                    </p>
                </div>

                {job.audioUrl ? (
                    <WaveformRegionsPlayer
                        audioUrl={job.audioUrl}
                        regions={waveformRegions}
                        onRegionUpdate={handleWaveformRegionUpdate}
                        editable={!readOnly}
                        height={96}
                    />
                ) : (
                    <div className="text-sm text-slate-500">
                        Audio is not available yet. Refresh once processing is complete.
                    </div>
                )}
            </div>

            <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Sentences ({sentences.length})</h3>
                    <Btn.Primary onClick={handleSave} disabled={saving || readOnly}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </Btn.Primary>
                </div>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {sentences.map((sentence, index) => {
                        const duration = sentence.end - sentence.start;
                        const isActive = activeSentence === index;

                        return (
                            <div
                                key={`${sentence.start}-${index}`}
                                className={`
                                    border rounded-xl p-3 space-y-2
                                    ${isActive ? "border-brand bg-brand-soft/60" : "border-slate-200 bg-slate-50"}
                                `}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-900">Sentence {index + 1}</span>
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
                                        disabled={!job.audioUrl}
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

export default AudioProcessingJobSentencesPage;
