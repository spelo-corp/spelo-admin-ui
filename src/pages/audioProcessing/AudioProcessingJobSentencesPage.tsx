import {
    Clock,
    Loader2,
    Play,
    Redo2,
    Save,
    Scissors,
    Search,
    Trash2,
    Undo2,
    Wand2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { WaveformRegionsPlayer } from "../../components/audio/WaveformRegionsPlayer";
import { Btn } from "../../components/ui/Btn";
import { usePresignedAudioUrl } from "../../hooks/usePresignedAudioUrl";
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
    const sentenceStopHandlerRef = useRef<(() => void) | null>(null);
    const sentenceTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
    const sentenceCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeSentence, setActiveSentence] = useState<number | null>(null);
    const [selectedSentenceIndexes, setSelectedSentenceIndexes] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [refining, setRefining] = useState(false);
    const [sentenceSearch, setSentenceSearch] = useState("");
    const [savedSentencesSnapshot, setSavedSentencesSnapshot] = useState<string>("");

    // Undo/redo stacks
    const undoStackRef = useRef<AudioSentence[][]>([]);
    const redoStackRef = useRef<AudioSentence[][]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const lastFocusSnapshotRef = useRef<boolean>(false);
    const lastClickedIndexRef = useRef<number | null>(null);

    // Fetch presigned URL for the audio
    const { url: presignedAudioUrl, loading: loadingUrl } = usePresignedAudioUrl(job.audioUrl);

    // Set initial snapshot when sentences load (intentionally only on job change)
    // biome-ignore lint/correctness/useExhaustiveDependencies: only reset snapshot on job change, not every edit
    useEffect(() => {
        setSavedSentencesSnapshot(JSON.stringify(sentences));
    }, [job.id]);

    const isDirty = JSON.stringify(sentences) !== savedSentencesSnapshot;

    const pushUndo = useCallback((snapshot: AudioSentence[]) => {
        undoStackRef.current.push(snapshot);
        if (undoStackRef.current.length > 50) undoStackRef.current.shift();
        redoStackRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
    }, []);

    const handleUndo = useCallback(() => {
        const stack = undoStackRef.current;
        if (stack.length === 0) return;
        const prev = stack.pop() as AudioSentence[];
        redoStackRef.current.push([...sentences]);
        setSentences(prev);
        setCanUndo(stack.length > 0);
        setCanRedo(true);
    }, [sentences, setSentences]);

    const handleRedo = useCallback(() => {
        const stack = redoStackRef.current;
        if (stack.length === 0) return;
        const next = stack.pop() as AudioSentence[];
        undoStackRef.current.push([...sentences]);
        setSentences(next);
        setCanRedo(stack.length > 0);
        setCanUndo(true);
    }, [sentences, setSentences]);

    const handleFieldFocus = useCallback(() => {
        if (!lastFocusSnapshotRef.current) {
            pushUndo([...sentences]);
            lastFocusSnapshotRef.current = true;
        }
    }, [pushUndo, sentences]);

    const handleFieldBlur = useCallback(() => {
        lastFocusSnapshotRef.current = false;
    }, []);

    // Unsaved changes warning
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    // Scroll to active sentence
    useEffect(() => {
        if (activeSentence === null) return;
        sentenceCardRefs.current[activeSentence]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }, [activeSentence]);

    // Search/filter
    const filteredSentenceIndexes = useMemo(() => {
        const term = sentenceSearch.trim().toLowerCase();
        if (!term) return null;
        return sentences
            .map((s, i) => (s.text.toLowerCase().includes(term) ? i : -1))
            .filter((i) => i !== -1);
    }, [sentences, sentenceSearch]);

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

    const clearSentenceStopHandler = useCallback(() => {
        const audio = audioRef.current;
        const handler = sentenceStopHandlerRef.current;
        if (audio && handler) {
            audio.removeEventListener("timeupdate", handler);
        }
        sentenceStopHandlerRef.current = null;
    }, []);

    useEffect(() => () => clearSentenceStopHandler(), [clearSentenceStopHandler]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: reset selection on job navigation
    useEffect(() => {
        setSelectedSentenceIndexes([]);
    }, [job.id]);

    const handlePlaySentence = useCallback(
        (sentence: AudioSentence, index: number) => {
            const audio = audioRef.current;
            if (!audio) return;

            const stopTime = sentence.end;

            const stopIfNeeded = () => {
                if (audio.currentTime >= stopTime) {
                    audio.pause();
                    clearSentenceStopHandler();
                }
            };

            clearSentenceStopHandler();
            audio.pause();
            audio.currentTime = sentence.start;
            sentenceStopHandlerRef.current = stopIfNeeded;
            audio.addEventListener("timeupdate", stopIfNeeded);
            void audio.play();
            setActiveSentence(index);
        },
        [clearSentenceStopHandler],
    );

    const toggleSentenceSelection = (index: number, shiftKey: boolean) => {
        if (shiftKey && lastClickedIndexRef.current !== null) {
            const from = Math.min(lastClickedIndexRef.current, index);
            const to = Math.max(lastClickedIndexRef.current, index);
            setSelectedSentenceIndexes((prev) => {
                const range = Array.from({ length: to - from + 1 }, (_, i) => from + i);
                const merged = new Set([...prev, ...range]);
                return [...merged].sort((a, b) => a - b);
            });
        } else {
            setSelectedSentenceIndexes((prev) => {
                if (prev.includes(index)) return prev.filter((i) => i !== index);
                return [...prev, index].sort((a, b) => a - b);
            });
        }
        lastClickedIndexRef.current = index;
    };

    const handleToggleSelectAll = () => {
        if (selectedSentenceIndexes.length === sentences.length) {
            setSelectedSentenceIndexes([]);
        } else {
            setSelectedSentenceIndexes(sentences.map((_, i) => i));
        }
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
            i === 0 ? true : idx === sortedIndexes[i - 1] + 1,
        );

        if (!areConsecutive) {
            setError("Please select consecutive sentences to merge.");
            return;
        }

        const selectedSentences = sortedIndexes.map((idx) => sentences[idx]).filter(Boolean);

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

        pushUndo([...sentences]);
        setSentences((prev) => {
            const next = prev.filter((_, idx) => !sortedIndexes.includes(idx));
            next.splice(sortedIndexes[0], 0, mergedSentence);
            return next;
        });

        setActiveSentence(sortedIndexes[0]);
        setSelectedSentenceIndexes([]);
    };

    const handleSplitSentence = (index: number) => {
        if (readOnly) return;
        const sentence = sentences[index];
        const textarea = sentenceTextareaRefs.current[index];
        const cursorPos = textarea?.selectionStart ?? Math.floor(sentence.text.length / 2);

        const textBefore = sentence.text.slice(0, cursorPos).trim();
        const textAfter = sentence.text.slice(cursorPos).trim();
        if (!textBefore || !textAfter) return;

        const midTime = (sentence.start + sentence.end) / 2;
        const first = { text: textBefore, start: sentence.start, end: Number(midTime.toFixed(3)) };
        const second = { text: textAfter, start: Number(midTime.toFixed(3)), end: sentence.end };

        pushUndo([...sentences]);
        setSentences((prev) => {
            const next = [...prev];
            next.splice(index, 1, first, second);
            return next;
        });
    };

    const handleDeleteSentence = (index: number) => {
        if (readOnly) return;
        if (!window.confirm("Are you sure you want to delete this sentence?")) return;

        pushUndo([...sentences]);
        setSentences((prev) => prev.filter((_, i) => i !== index));

        setSelectedSentenceIndexes((prev) =>
            prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
        );

        if (activeSentence === index) setActiveSentence(null);
        else if (activeSentence !== null && activeSentence > index)
            setActiveSentence(activeSentence - 1);
    };

    const handleDeleteSelected = () => {
        if (readOnly || selectedSentenceIndexes.length === 0) return;
        const count = selectedSentenceIndexes.length;
        if (!window.confirm(`Delete ${count} selected sentence${count > 1 ? "s" : ""}?`)) return;
        pushUndo([...sentences]);
        const toDelete = new Set(selectedSentenceIndexes);
        setSentences((prev) => prev.filter((_, i) => !toDelete.has(i)));
        setSelectedSentenceIndexes([]);
        setActiveSentence(null);
    };

    const handleSave = useCallback(async () => {
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
            setSavedSentencesSnapshot(JSON.stringify(sentences));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save sentences.");
        } finally {
            setSaving(false);
        }
    }, [sentences, job.id, setError, setJob]);

    const handleRefine = async () => {
        setRefining(true);
        setError(null);
        try {
            // Save current sentences first so the server has the latest edits
            await api.updateAudioProcessingSentences(job.id, sentences);
            // Call refine endpoint
            const refined = await api.refineBoundaries(job.id);
            if (refined.sentences && refined.sentences.length > 0) {
                setSentences(refined.sentences);
                setJob((prev) => (prev ? { ...prev, sentences: refined.sentences } : prev));
                setSavedSentencesSnapshot(JSON.stringify(refined.sentences));
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to refine boundaries.");
        } finally {
            setRefining(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;

            if (mod && e.key === "s") {
                e.preventDefault();
                if (!saving && !readOnly) handleSave();
                return;
            }

            if (mod && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                if (!readOnly) handleUndo();
                return;
            }

            if ((mod && e.shiftKey && e.key === "z") || (mod && e.key === "y")) {
                e.preventDefault();
                if (!readOnly) handleRedo();
                return;
            }

            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            if (mod && e.key === "Enter") {
                e.preventDefault();
                if (activeSentence !== null)
                    handlePlaySentence(sentences[activeSentence], activeSentence);
                return;
            }
            if (e.altKey && e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSentence((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
                return;
            }
            if (e.altKey && e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSentence((prev) =>
                    prev !== null && prev < sentences.length - 1 ? prev + 1 : prev,
                );
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [
        activeSentence,
        sentences,
        saving,
        readOnly,
        handleSave,
        handlePlaySentence,
        handleUndo,
        handleRedo,
    ]);

    const waveformRegions = useMemo(
        () =>
            sentences.map((sentence, index) => ({
                id: String(index),
                start: sentence.start,
                end: sentence.end,
                color: activeSentence === index ? "rgba(26,159,109,0.32)" : "rgba(14,165,233,0.24)",
            })),
        [sentences, activeSentence],
    );

    const waveformUndoPushedRef = useRef(false);
    const handleWaveformRegionUpdate = useCallback(
        (id: string, start: number, end: number) => {
            const index = Number(id);
            if (!Number.isFinite(index)) return;

            if (!waveformUndoPushedRef.current) {
                pushUndo([...sentences]);
                waveformUndoPushedRef.current = true;
                setTimeout(() => {
                    waveformUndoPushedRef.current = false;
                }, 500);
            }

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
        },
        [setSentences, pushUndo, sentences],
    );

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Audio Player</h2>
                        <p className="text-xs text-slate-500">
                            Use play to verify sentence boundaries.
                        </p>
                    </div>
                </div>

                {loadingUrl ? (
                    <div className="text-sm text-slate-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading audio...
                    </div>
                ) : presignedAudioUrl ? (
                    <audio
                        ref={audioRef}
                        controls
                        src={presignedAudioUrl}
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

                {presignedAudioUrl ? (
                    <WaveformRegionsPlayer
                        audioUrl={presignedAudioUrl}
                        regions={waveformRegions}
                        onRegionUpdate={handleWaveformRegionUpdate}
                        editable={!readOnly}
                        height={96}
                    />
                ) : (
                    <div className="text-sm text-slate-500">
                        {loadingUrl
                            ? "Loading audio..."
                            : "Audio is not available yet. Refresh once processing is complete."}
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
                            {selectedSentenceIndexes.length} selected · Shift+click for range
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Btn.Secondary onClick={handleUndo} disabled={!canUndo || readOnly}>
                            <Undo2 className="w-4 h-4" /> Undo
                        </Btn.Secondary>
                        <Btn.Secondary onClick={handleRedo} disabled={!canRedo || readOnly}>
                            <Redo2 className="w-4 h-4" /> Redo
                        </Btn.Secondary>
                        <Btn.Secondary
                            onClick={mergeSelectedSentences}
                            disabled={readOnly || selectedSentenceIndexes.length < 2}
                        >
                            Merge Selected
                        </Btn.Secondary>
                        <Btn.Secondary
                            onClick={handleDeleteSelected}
                            disabled={readOnly || selectedSentenceIndexes.length === 0}
                            className="text-rose-600 hover:text-rose-700"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Selected
                        </Btn.Secondary>
                        <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            disabled={readOnly}
                            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-60"
                        >
                            {selectedSentenceIndexes.length === sentences.length
                                ? "Deselect all"
                                : "Select all"}
                        </button>
                        <Btn.Secondary
                            onClick={handleRefine}
                            disabled={refining || readOnly || sentences.length < 2}
                        >
                            {refining ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Refining…
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    Refine Boundaries
                                </>
                            )}
                        </Btn.Secondary>
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
                        {isDirty && (
                            <span className="text-xs text-amber-600 font-medium">
                                • Unsaved changes
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search sentences…"
                            value={sentenceSearch}
                            onChange={(e) => setSentenceSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                        />
                    </div>
                    {filteredSentenceIndexes !== null && (
                        <span className="text-xs text-slate-500">
                            {filteredSentenceIndexes.length} of {sentences.length} sentences match
                        </span>
                    )}
                </div>

                <p className="text-[11px] text-slate-400">
                    Ctrl+Z Undo · Ctrl+Shift+Z Redo · Ctrl+S Save · Ctrl+Enter Play · Alt+↑↓
                    Navigate
                </p>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {sentences.map((sentence, index) => {
                        if (
                            filteredSentenceIndexes !== null &&
                            !filteredSentenceIndexes.includes(index)
                        )
                            return null;

                        const duration = sentence.end - sentence.start;
                        const isActive = activeSentence === index;
                        const isSelected = selectedSentenceIndexes.includes(index);

                        return (
                            <div
                                key={`${sentence.start}-${index}`}
                                ref={(el) => {
                                    sentenceCardRefs.current[index] = el;
                                }}
                                className={`
                                    border rounded-xl p-3 space-y-2
                                    ${
                                        isActive
                                            ? "border-brand bg-brand-soft/60"
                                            : isSelected
                                              ? "border-sky-200 bg-sky-50"
                                              : "border-slate-200 bg-slate-50"
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-1 text-slate-500">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) =>
                                                    toggleSentenceSelection(
                                                        index,
                                                        (e.nativeEvent as MouseEvent).shiftKey,
                                                    )
                                                }
                                                disabled={readOnly}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30"
                                            />
                                            Select
                                        </label>
                                        <span className="font-semibold text-slate-900">
                                            Sentence {index + 1}
                                        </span>
                                    </div>
                                    <span className="text-slate-500">
                                        {formatSeconds(sentence.start)} →{" "}
                                        {formatSeconds(sentence.end)} • {duration.toFixed(2)}s
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

                                    <button
                                        onClick={() => handleSplitSentence(index)}
                                        className="px-3 py-1 rounded-full border border-slate-300 text-slate-700 flex items-center gap-1 hover:bg-slate-100"
                                        type="button"
                                        disabled={readOnly}
                                        title="Split sentence at cursor position"
                                    >
                                        <Scissors className="w-3 h-3" /> Split
                                    </button>

                                    <label className="flex items-center gap-1 text-slate-500">
                                        Start
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={sentence.start}
                                            onFocus={handleFieldFocus}
                                            onBlur={handleFieldBlur}
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
                                            onFocus={handleFieldFocus}
                                            onBlur={handleFieldBlur}
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

                                    <button
                                        onClick={() => handleDeleteSentence(index)}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-auto"
                                        title="Delete sentence"
                                        disabled={readOnly}
                                        type="button"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <textarea
                                    ref={(el) => {
                                        sentenceTextareaRefs.current[index] = el;
                                    }}
                                    value={sentence.text}
                                    onFocus={handleFieldFocus}
                                    onBlur={handleFieldBlur}
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
                            No sentences available yet. If the job is still processing, try
                            refreshing.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioProcessingJobSentencesPage;
