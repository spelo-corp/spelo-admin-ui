import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    UploadCloud,
    Loader2,
    FileAudio,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";
import { api } from "../../api/client";
import type { Lesson } from "../../types";
import { Input } from "../../components/ui/Input";
import { Btn } from "../../components/ui/Btn";

const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(1)} ${sizes[i]}`;
};

const AudioProcessingUploadPage: React.FC = () => {
    const navigate = useNavigate();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loadingLessons, setLoadingLessons] = useState(true);

    const [file, setFile] = useState<File | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [lessonId, setLessonId] = useState<string>("");
    const [transcript, setTranscript] = useState("");
    const [translatedScript, setTranslatedScript] = useState("");
    const [type, setType] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [successJobId, setSuccessJobId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.getLessons();
                if (res.success) setLessons(res.lessons);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load lessons.");
            } finally {
                setLoadingLessons(false);
            }
        })();
    }, []);

    // Simulate a visible progress bar during submission
    useEffect(() => {
        if (!submitting) {
            setUploadProgress(0);
            return;
        }

        setUploadProgress(12);
        const timer = window.setInterval(() => {
            setUploadProgress((p) => Math.min(p + 8, 90));
        }, 400);

        return () => window.clearInterval(timer);
    }, [submitting]);

    const transcriptCount = useMemo(() => transcript.trim().length, [transcript]);

    const handleFile = (selected: File | null) => {
        if (!selected) return;
        setFile(selected);
        setDuration(null);

        // Try to read duration for preview
        const audio = new Audio();
        const url = URL.createObjectURL(selected);
        audio.src = url;
        audio.onloadedmetadata = () => {
            setDuration(audio.duration);
            URL.revokeObjectURL(url);
        };
        audio.onerror = () => URL.revokeObjectURL(url);
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const dropped = event.dataTransfer?.files?.[0];
        if (dropped) handleFile(dropped);
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccessJobId(null);

        if (!file || !lessonId || !transcript.trim()) {
            setError("Lesson, transcript, and audio file are required.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.submitAudioProcessingJob({
                file,
                transcript: transcript.trim(),
                lessonId: Number(lessonId),
                translatedScript: translatedScript.trim() || undefined,
                type: type ? Number(type) : undefined,
            });

            const jobId =
                (res as { data?: { jobId?: number } }).data?.jobId ??
                (res as { jobId?: number }).jobId ??
                null;

            setUploadProgress(100);
            setSuccessJobId(jobId);

            if (jobId) {
                // small delay to let users see the success state
                setTimeout(() => navigate(`/admin/audio-processing/jobs/${jobId}`), 350);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to submit audio for processing.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        to="/admin/audio-processing"
                        className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-700"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>
                    <h1 className="text-3xl font-semibold text-slate-900 mt-2">
                        Upload Lesson Audio
                    </h1>
                    <p className="text-sm text-slate-500">
                        Attach audio, provide the transcript, and start processing.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    {/* Lesson selection */}
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Lesson</h2>
                            {loadingLessons && (
                                <span className="text-xs text-slate-500">Loading lessons…</span>
                            )}
                        </div>
                        <select
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                            value={lessonId}
                            onChange={(e) => setLessonId(e.target.value)}
                        >
                            <option value="">Select a lesson</option>
                            {lessons.map((lesson) => (
                                <option key={lesson.id} value={lesson.id}>
                                    {lesson.name} (ID {lesson.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Audio input */}
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">Audio file</h2>

                        <label
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                                ${isDragging ? "border-brand bg-brand-soft" : "border-slate-200 bg-slate-50"}
                            `}
                        >
                            <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                            />
                            <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                            <p className="text-sm text-slate-700">
                                Drag & drop your audio file here or click to browse
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Supported: MP3, WAV, M4A, AAC up to 100 MB
                            </p>
                        </label>

                        {file && (
                            <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-slate-50">
                                <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                                    <FileAudio className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900 text-sm">
                                        {file.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {formatBytes(file.size)} • {file.type || "audio"}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Duration: {duration ? `${duration.toFixed(1)}s` : "Loading…"}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setDuration(null);
                                    }}
                                    className="text-xs text-rose-600 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Transcript */}
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Transcript</h2>
                            <span className="text-xs text-slate-500">{transcriptCount} chars</span>
                        </div>
                        <textarea
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[140px]"
                            placeholder="Paste or type the transcript here…"
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                        />

                        <label className="block text-xs font-medium text-slate-600">
                            Translated transcript (optional)
                        </label>
                        <textarea
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[100px]"
                            placeholder="Translated transcript for the audio (optional)…"
                            value={translatedScript}
                            onChange={(e) => setTranslatedScript(e.target.value)}
                        />
                    </div>

                    {/* Meta */}
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-3">
                        <label className="block text-xs font-medium text-slate-600">
                            Audio type (optional)
                        </label>
                        <Input
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            placeholder="e.g. 1 for lesson audio"
                            type="number"
                            className="rounded-xl"
                        />
                    </div>
                </div>

                {/* Summary / Actions */}
                <div className="space-y-4">
                    <div className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-3">
                        <h3 className="text-base font-semibold text-slate-900">Upload summary</h3>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Lesson is required.</li>
                            <li>• Transcript is required for processing.</li>
                            <li>• Audio file formats: MP3, WAV, M4A, AAC.</li>
                        </ul>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {successJobId && (
                            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                                <CheckCircle2 className="w-4 h-4" />
                                Submitted! Job ID {successJobId}
                            </div>
                        )}

                        {submitting && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>Uploading</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <Btn.Primary
                            onClick={handleSubmit}
                            className="w-full justify-center"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4" />
                                    Submit for Processing
                                </>
                            )}
                        </Btn.Primary>

                        <Link
                            to="/admin/audio-processing"
                            className="block text-center text-xs text-slate-500 hover:text-slate-700"
                        >
                            Cancel and go back
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioProcessingUploadPage;
