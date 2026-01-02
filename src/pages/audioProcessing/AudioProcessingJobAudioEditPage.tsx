import React, { useCallback, useEffect, useRef, useState } from "react";
import { Clock, FileAudio, Loader2, Play, Square, UploadCloud } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { usePresignedAudioUrl } from "../../hooks/usePresignedAudioUrl";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";
import type { AudioProcessingJobOutletContext } from "./AudioProcessingJobPage";

const AudioProcessingJobAudioEditPage: React.FC = () => {
    const { job, sentences, readOnly, setError, reloadJob } =
        useOutletContext<AudioProcessingJobOutletContext>();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previewStopHandlerRef = useRef<(() => void) | null>(null);

    const [replaceStart, setReplaceStart] = useState(0);
    const [replaceEnd, setReplaceEnd] = useState(0);
    const [replacing, setReplacing] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [defaultEnd, setDefaultEnd] = useState<number | null>(null);

    // Fetch presigned URL for the audio
    const { url: presignedAudioUrl, loading: loadingUrl } = usePresignedAudioUrl(job.audioUrl);

    // Set default trim end to full audio duration when metadata is ready (with fallback to sentences)
    useEffect(() => {
        let cancelled = false;
        const fallbackEnd = sentences.reduce((max, s) => Math.max(max, s.end || 0), 0);

        async function loadDuration() {
            if (!presignedAudioUrl) {
                if (fallbackEnd > 0) {
                    setDefaultEnd(fallbackEnd);
                    setReplaceEnd((prev) => (prev <= 0 ? fallbackEnd : prev));
                }
                return;
            }

            try {
                const tmpAudio = new Audio();
                tmpAudio.preload = "metadata";
                tmpAudio.src = presignedAudioUrl;

                const duration = await new Promise<number>((resolve, reject) => {
                    tmpAudio.onloadedmetadata = () => resolve(tmpAudio.duration);
                    tmpAudio.onerror = () => reject(new Error("Failed to load audio metadata"));
                });

                if (cancelled) return;
                if (Number.isFinite(duration) && duration > 0) {
                    const rounded = Number(duration.toFixed(3));
                    setDefaultEnd(rounded);
                    setReplaceEnd((prev) => (prev <= 0 ? rounded : prev));
                    return;
                }
            } catch {
                // ignore, try fallback
            }

            if (!cancelled && fallbackEnd > 0) {
                setDefaultEnd(fallbackEnd);
                setReplaceEnd((prev) => (prev <= 0 ? fallbackEnd : prev));
            }
        }

        void loadDuration();
        return () => {
            cancelled = true;
        };
    }, [presignedAudioUrl, sentences]);

    const stopPreviewPlayback = useCallback(() => {
        const audio = audioRef.current;
        const stopHandler = previewStopHandlerRef.current;
        previewStopHandlerRef.current = null;

        if (!audio) {
            setPreviewing(false);
            return;
        }

        if (stopHandler) {
            audio.removeEventListener("timeupdate", stopHandler);
        }

        audio.pause();
        setPreviewing(false);
    }, []);

    useEffect(() => () => stopPreviewPlayback(), [stopPreviewPlayback]);

    const setReplaceStartFromCurrent = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setReplaceStart(Number(audio.currentTime.toFixed(3)));
    };

    const setReplaceEndFromCurrent = () => {
        const audio = audioRef.current;
        if (!audio) return;
        const time = Number(audio.currentTime.toFixed(3));
        if (time > 0) {
            setReplaceEnd(time);
            return;
        }

        if (defaultEnd && defaultEnd > 0) {
            setReplaceEnd(defaultEnd);
        } else if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setReplaceEnd(Number(audio.duration.toFixed(3)));
        }
    };

    const handlePreviewReplaceSegment = () => {
        const audio = audioRef.current;
        if (!audio) {
            setError("No audio available to preview.");
            return;
        }
        const start = Math.max(0, replaceStart);
        const end = replaceEnd > 0 ? replaceEnd : audio.duration;
        if (end <= start) {
            setError("End time must be greater than start time to preview.");
            return;
        }

        const stopAt = end;

        const stopIfNeeded = () => {
            if (audio.currentTime >= stopAt) {
                stopPreviewPlayback();
            }
        };

        stopPreviewPlayback();

        audio.currentTime = start;
        setPreviewing(true);
        previewStopHandlerRef.current = stopIfNeeded;
        audio.addEventListener("timeupdate", stopIfNeeded);
        void audio.play();
    };

    const handleReplaceAudio = async () => {
        if (readOnly) return;
        if (!job?.audioUrl) {
            setError("Audio is not available yet to update.");
            return;
        }
        setReplacing(true);
        setError(null);
        try {
            const resolvedEnd =
                replaceEnd > 0 ? replaceEnd : defaultEnd ?? audioRef.current?.duration ?? 0;
            const resolvedStart = Math.max(0, replaceStart);
            if (!resolvedEnd || resolvedEnd <= resolvedStart) {
                throw new Error("End time must be greater than start time.");
            }

            const segments = [{ start: resolvedStart, end: resolvedEnd }];
            await api.editAudioJob(job.id, segments);

            await reloadJob({ silent: true });

            setReplaceStart(0);
            setReplaceEnd(0);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update audio.");
        } finally {
            setReplacing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Audio</h2>
                        <p className="text-xs text-slate-500">Use playhead to set start/end quickly.</p>
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
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileAudio className="w-4 h-4" />
                    Edit Audio (keep segments)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600">Start (s)</label>
                        <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={replaceStart}
                            onChange={(e) => setReplaceStart(Number(e.target.value))}
                        />
                        <button
                            className="text-[11px] text-brand hover:underline mt-1"
                            type="button"
                            onClick={setReplaceStartFromCurrent}
                            disabled={!presignedAudioUrl}
                        >
                            Use current playhead
                        </button>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600">End (s)</label>
                        <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={replaceEnd}
                            onChange={(e) => setReplaceEnd(Number(e.target.value))}
                        />
                        <button
                            className="text-[11px] text-brand hover:underline mt-1"
                            type="button"
                            onClick={setReplaceEndFromCurrent}
                            disabled={!presignedAudioUrl}
                        >
                            Use current playhead
                        </button>
                    </div>
                </div>

                <p className="text-[11px] text-slate-500">
                    Send the selected segment to the backend. The job status resets to PENDING and will reprocess with the edited audio.
                </p>

                <div className="flex flex-wrap gap-2">
                    <Btn.Secondary
                        type="button"
                        onClick={previewing ? stopPreviewPlayback : handlePreviewReplaceSegment}
                        disabled={!presignedAudioUrl || readOnly}
                        className="flex-1 justify-center"
                    >
                        {previewing ? (
                            <>
                                <Square className="w-4 h-4" />
                                Stop preview
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Preview selection
                            </>
                        )}
                    </Btn.Secondary>
                    <Btn.Secondary
                        type="button"
                        onClick={() => {
                            setReplaceStart(0);
                            setReplaceEnd(0);
                        }}
                        className="flex-1 justify-center"
                    >
                        Clear times
                    </Btn.Secondary>
                </div>

                <Btn.Primary
                    onClick={handleReplaceAudio}
                    className="w-full justify-center"
                    disabled={readOnly || replacing || !presignedAudioUrl}
                >
                    {replacing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving audio…
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-4 h-4" />
                            Save audio
                        </>
                    )}
                </Btn.Primary>
            </div>
        </div>
    );
};

export default AudioProcessingJobAudioEditPage;

