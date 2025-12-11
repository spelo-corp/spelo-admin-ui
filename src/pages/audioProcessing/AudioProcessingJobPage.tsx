import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    RefreshCcw,
    Save,
    CheckCircle2,
    Play,
    Clock,
    Loader2,
    AlertTriangle,
    UploadCloud,
    FileAudio,
} from "lucide-react";
import { api } from "../../api/client";
import type { AudioJob, AudioSentence } from "../../types/audioProcessing";
import { StatusBadge } from "../../components/audioProcessing/StatusBadge";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";

const formatSeconds = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
};

const AudioProcessingJobPage: React.FC = () => {
    const { jobId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [replaceFile, setReplaceFile] = useState<File | null>(null);
    const [replaceStart, setReplaceStart] = useState(0);
    const [replaceEnd, setReplaceEnd] = useState(0);
    const [replacing, setReplacing] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [replaceProgress, setReplaceProgress] = useState(0);

    const [job, setJob] = useState<AudioJob | null>(null);
    const [sentences, setSentences] = useState<AudioSentence[]>([]);
    const [activeSentence, setActiveSentence] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isReviewMode = location.pathname.endsWith("/review");
    const readOnly = isReviewMode || job?.status === "FINALIZED";

    const loadJob = async () => {
        if (!jobId) return;
        setError(null);
        setLoading(true);
        try {
            const res = await api.getAudioProcessingJob(Number(jobId));
            const data =
                (res as { data?: AudioJob }).data ??
                (res as { job?: AudioJob }).job ??
                (res as AudioJob | null);

            setJob(data);
            setSentences(data?.sentences ?? []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load job.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadJob();
    }, [jobId]);

    // Track playhead to highlight the current sentence
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadJob();
        setRefreshing(false);
    };

    const handleSave = async () => {
        if (!job) return;
        const hasInvalidTimes = sentences.some((s) => s.end <= s.start);
        if (hasInvalidTimes) {
            setError("End time must be greater than start time for every sentence.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await api.updateAudioProcessingSentences(job.id, sentences);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save sentences.");
        } finally {
            setSaving(false);
        }
    };

    const setReplaceStartFromCurrent = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setReplaceStart(Number(audio.currentTime.toFixed(3)));
    };

    const setReplaceEndFromCurrent = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setReplaceEnd(Number(audio.currentTime.toFixed(3)));
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

        audio.currentTime = start;
        const stopAt = end;

        const stopIfNeeded = () => {
            if (audio.currentTime >= stopAt) {
                audio.pause();
                audio.removeEventListener("timeupdate", stopIfNeeded);
                setPreviewing(false);
            }
        };

        setPreviewing(true);
        audio.addEventListener("timeupdate", stopIfNeeded);
        void audio.play();
    };

    const handleFinalize = async () => {
        if (!job) return;
        setFinalizing(true);
        setError(null);
        try {
            await api.finalizeAudioProcessingJob(job.id);
            await loadJob();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to finalize job.");
        } finally {
            setFinalizing(false);
        }
    };

    const encodeWav = (audioBuffer: AudioBuffer): ArrayBuffer => {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const samples = audioBuffer.length;
        const dataLength = samples * numChannels * 2;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);

        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        writeString(0, "RIFF");
        view.setUint32(4, 36 + dataLength, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true); // PCM chunk size
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
        view.setUint16(32, numChannels * 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        writeString(36, "data");
        view.setUint32(40, dataLength, true);

        // Interleave channels
        let offset = 44;
        const channelData: Float32Array[] = [];
        for (let ch = 0; ch < numChannels; ch++) {
            channelData.push(audioBuffer.getChannelData(ch));
        }

        for (let i = 0; i < samples; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                let sample = channelData[ch][i];
                sample = Math.max(-1, Math.min(1, sample));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }

        return buffer;
    };

    const trimAudioFile = async (file: File, start: number, end: number): Promise<File> => {
        if (start <= 0 && (!end || end <= 0)) return file;

        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

        const safeStart = Math.max(0, start);
        const safeEnd =
            end && end > 0 ? Math.min(end, decoded.duration) : decoded.duration;
        if (safeEnd <= safeStart) {
            throw new Error("End time must be greater than start time.");
        }

        const sampleRate = decoded.sampleRate;
        const frameStart = Math.floor(safeStart * sampleRate);
        const frameEnd = Math.floor(safeEnd * sampleRate);
        const frameLength = frameEnd - frameStart;

        const trimmed = audioCtx.createBuffer(
            decoded.numberOfChannels,
            frameLength,
            sampleRate
        );

        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
            const channelData = decoded.getChannelData(ch);
            trimmed.copyToChannel(channelData.slice(frameStart, frameEnd), ch, 0);
        }

        const wavBuffer = encodeWav(trimmed);
        const trimmedBlob = new Blob([wavBuffer], { type: "audio/wav" });
        const name = file.name.replace(/\.[^/.]+$/, "") + "_trimmed.wav";
        return new File([trimmedBlob], name, { type: "audio/wav" });
    };

    const handleReplaceAudio = async () => {
        if (!job) return;
        if (!replaceFile) {
            setError("Please choose a new audio file to upload.");
            return;
        }
        setReplacing(true);
        setReplaceProgress(10);
        const timer = window.setInterval(() => {
            setReplaceProgress((p) => Math.min(p + 8, 90));
        }, 300);
        setError(null);
        try {
            const trimmed = await trimAudioFile(replaceFile, replaceStart, replaceEnd);
            console.log("trimmed" + trimmed)
            await api.replaceAudioForJob(job.id, trimmed);
            await loadJob();
            setReplaceFile(null);
            setReplaceStart(0);
            setReplaceEnd(0);
            setReplaceProgress(100);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to replace audio.");
            setReplaceProgress(0);
        } finally {
            window.clearInterval(timer);
            setReplacing(false);
        }
    };

    const jobMeta = useMemo(() => {
        if (!job) return [];
        return [
            { label: "Job ID", value: `#${job.id}` },
            { label: "Lesson", value: job.lessonName ? `${job.lessonName} (${job.lessonId})` : `Lesson ${job.lessonId}` },
            { label: "Created", value: new Date(job.createdAt).toLocaleString() },
            { label: "Updated", value: new Date(job.updatedAt).toLocaleString() },
        ];
    }, [job]);

    if (loading) {
        return (
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6 flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading job…
            </div>
        );
    }

    if (!job) {
        return (
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                <p className="text-slate-700">Job not found.</p>
                <Link to="/admin/audio-processing" className="text-brand hover:underline text-sm">
                    Back to dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-700"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-semibold text-slate-900">Job #{job.id}</h1>
                        <StatusBadge status={job.status} />
                        {isReviewMode && (
                            <span className="text-[11px] px-2 py-1 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wide">
                                Review mode
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500">
                        Manage transcript alignment and finalize when ready.
                    </p>
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Btn.Secondary onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Btn.Secondary>
                    <Btn.Primary
                        onClick={handleFinalize}
                        disabled={readOnly || finalizing}
                        className={readOnly ? "opacity-60 cursor-not-allowed" : ""}
                    >
                        {finalizing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Finalizing…
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                {readOnly ? "Finalized" : "Finalize Job"}
                            </>
                        )}
                    </Btn.Primary>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 lg:gap-6 items-start">
                {/* Audio + meta */}
                <div className="space-y-3 lg:space-y-4">
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Audio</h2>
                                <p className="text-xs text-slate-500">
                                    Preview playback to check boundaries.
                                </p>
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

                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 grid sm:grid-cols-2 gap-3">
                        {jobMeta.map((item) => (
                            <div key={item.label} className="space-y-1">
                                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                                    {item.label}
                                </div>
                                <div className="font-semibold text-slate-900 text-sm">
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 lg:space-y-4">
                    {/* Update audio */}
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 lg:p-5 space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <FileAudio className="w-4 h-4" />
                            Update / Trim Audio
                        </h3>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-slate-600">
                                New audio file
                            </label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
                                className="block w-full text-xs"
                            />
                            {replaceFile && (
                                <div className="text-xs text-slate-600">
                                    {replaceFile.name} ({(replaceFile.size / 1024 / 1024).toFixed(2)} MB)
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600">
                                    Start (s)
                                </label>
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
                                >
                                    Use current playhead
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600">
                                    End (s)
                                </label>
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
                                >
                                    Use current playhead
                                </button>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-500">
                            If start/end are set, that portion is trimmed locally before upload.
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <Btn.Secondary
                                type="button"
                                onClick={handlePreviewReplaceSegment}
                                disabled={previewing}
                                className="flex-1 justify-center"
                            >
                                {previewing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Previewing…
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

                        {replacing && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>Uploading new audio</span>
                                    <span>{replaceProgress}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand transition-all"
                                        style={{ width: `${replaceProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <Btn.Primary
                            disabled={replacing || !replaceFile}
                            onClick={handleReplaceAudio}
                            className="w-full justify-center"
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
            </div>

            {/* Status + Sentences */}
            <div className="space-y-4">
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
                        <p>
                            Update sentences below, then save changes. Finalizing will lock the job for editing.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Sentences ({sentences.length})
                        </h3>
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

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
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
                                        <span className="font-semibold text-slate-900">
                                            Sentence {index + 1}
                                        </span>
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
        </div>
    );
};

export default AudioProcessingJobPage;
