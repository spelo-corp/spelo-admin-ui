import React, { useState } from "react";
import { Btn } from "../ui/Btn";
import { Input } from "../ui/Input";
import { Upload, Link2, FileText, Pencil } from "lucide-react";
import type { Lesson } from "../../types";
import { api } from "../../api/client";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    lessons: Lesson[];
    defaultLessonId?: number | null;
}

export const CreateJobModal: React.FC<Props> = ({
    open,
    onClose,
    onCreated,
    lessons,
    defaultLessonId = null,
}) => {
    const [lessonId, setLessonId] = useState<number | null>(defaultLessonId);
    const [type, setType] = useState(2);

    const [audioUrl, setAudioUrl] = useState("");
    const [audioFile, setAudioFile] = useState<File | null>(null);

    const [transcriptMode, setTranscriptMode] =
        useState<"file" | "text" | "url">("text");
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
    const [transcriptText, setTranscriptText] = useState("");
    const [transcriptUrl, setTranscriptUrl] = useState("");
    const [translatedScript, setTranslatedScript] = useState("");

    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);

    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Keep the lesson in sync when we open for a specific one
    React.useEffect(() => {
        if (defaultLessonId) setLessonId(defaultLessonId);
    }, [defaultLessonId]);

    const readTranscriptFile = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(new Error("Failed to read transcript file."));
            reader.readAsText(file);
        });

    const resolveTranscript = async (): Promise<string> => {
        if (transcriptMode === "text") return transcriptText.trim();

        if (transcriptMode === "file") {
            if (!transcriptFile) return "";
            return (await readTranscriptFile(transcriptFile)).trim();
        }

        if (transcriptMode === "url") {
            if (!transcriptUrl.trim()) return "";
            const res = await fetch(transcriptUrl.trim());
            if (!res.ok) throw new Error("Could not fetch transcript from URL.");
            return (await res.text()).trim();
        }

        return "";
    };

    const resolveAudioFile = async (): Promise<File | null> => {
        if (audioFile) return audioFile;

        if (audioUrl.trim()) {
            const res = await fetch(audioUrl.trim());
            if (!res.ok) throw new Error("Could not fetch audio from URL.");

            const blob = await res.blob();
            const fileName = audioUrl.split("/").pop() || "audio-file";
            return new File([blob], fileName, { type: blob.type || "audio/mpeg" });
        }

        return null;
    };

    const resetForm = () => {
        setLessonId(defaultLessonId ?? null);
        setType(2);
        setAudioUrl("");
        setAudioFile(null);
        setTranscriptMode("text");
        setTranscriptFile(null);
        setTranscriptText("");
        setTranscriptUrl("");
        setTranslatedScript("");
        setStartTime(0);
        setEndTime(0);
        setError(null);
    };

    const handleCreate = async () => {
        if (!lessonId) {
            setError("Please select a lesson.");
            return;
        }

        setError(null);
        setCreating(true);

        try {
            const audioToUpload = await resolveAudioFile();
            if (!audioToUpload) {
                throw new Error("Audio file is required.");
            }

            const transcriptValue = await resolveTranscript();
            if (!transcriptValue) {
                throw new Error("Transcript is required.");
            }
            const hasTiming = startTime > 0 || endTime > 0;

            await api.submitAudioProcessingJob({
                file: audioToUpload,
                transcript: transcriptValue,
                lessonId,
                translatedScript: translatedScript.trim() || undefined,
                type,
                startTime: hasTiming ? startTime : undefined,
                endTime: hasTiming ? endTime : undefined,
            });

            resetForm();
            onCreated();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create job.");
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center overflow-y-auto p-4">
            <div
                className="
                bg-white rounded-card shadow-shell w-full max-w-xl p-6
                max-h-[90vh] overflow-y-auto"
            >

                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Create Processing Job
                    </h2>
                    <button onClick={handleClose}>✕</button>
                </div>

                <div className="space-y-6 text-sm">

                    {/* LESSON + TYPE */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Lesson *
                            </label>
                            <select
                                className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                value={lessonId ?? ""}
                                disabled={!!defaultLessonId}
                                onChange={(e) =>
                                    setLessonId(
                                        e.target.value ? Number(e.target.value) : null
                                    )
                                }
                            >
                                <option value="">Select a lesson…</option>
                                {lessons.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} (Level {l.level})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Lesson Type *
                            </label>
                            <select
                                className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                value={type}
                                onChange={(e) => setType(Number(e.target.value))}
                            >
                                <option value={2}>Dictation</option>
                                <option value={1}>Full Audio</option>
                                <option value={3}>Multiple Choice</option>
                                <option value={4}>Shadowing</option>
                            </select>
                        </div>
                    </div>

                    {/* AUDIO MODE TOGGLE */}
                    <div className="flex gap-2 text-xs">
                        <button
                            className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
                                audioFile ? "bg-brand text-white" : "bg-white"
                            }`}
                            onClick={() => {
                                setAudioFile(null);
                                setAudioUrl("");
                            }}
                        >
                            <Upload className="w-4 h-4" /> Upload Audio
                        </button>

                        <button
                            className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
                                audioUrl ? "bg-brand text-white" : "bg-white"
                            }`}
                            onClick={() => {
                                setAudioFile(null);
                                setAudioUrl("");
                            }}
                        >
                            <Link2 className="w-4 h-4" /> Paste Audio URL
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                        Audio file is required for processing. If you provide a URL, we will try to download it first.
                    </p>

                    {/* AUDIO UPLOAD */}
                    {!audioUrl && (
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-slate-600">
                                Audio File
                            </label>

                            <div className="border border-slate-200 rounded-card p-4 text-center hover:bg-slate-50 cursor-pointer">
                                <label className="cursor-pointer text-slate-600 text-sm flex flex-col items-center gap-1">
                                    <Upload className="w-6 h-6 text-slate-400" />

                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="audio/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAudioFile(file);
                                                setAudioUrl("");
                                            }
                                        }}
                                    />

                                    {audioFile ? (
                                        <span className="font-medium text-slate-900">
                                            {audioFile.name}
                                        </span>
                                    ) : (
                                        <>Click to upload audio</>
                                    )}
                                </label>
                            </div>

                            {audioFile && (
                                <button
                                    className="text-xs text-rose-500 hover:underline"
                                    onClick={() => setAudioFile(null)}
                                >
                                    Remove audio
                                </button>
                            )}
                        </div>
                    )}

                    {/* AUDIO URL */}
                    {!audioFile && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Audio URL
                            </label>
                            <Input
                                value={audioUrl}
                                onChange={(e) => setAudioUrl(e.target.value)}
                                placeholder="https://example.com/audio.mp3"
                            />
                        </div>
                    )}

                    {/* TRANSCRIPT MODE TOGGLE */}
                    <div className="flex gap-2 text-xs">
                        <button
                            className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
                                transcriptMode === "file"
                                    ? "bg-brand text-white"
                                    : "bg-white"
                            }`}
                            onClick={() => setTranscriptMode("file")}
                        >
                            <Upload className="w-4 h-4" /> Upload Transcript
                        </button>

                        <button
                            className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
                                transcriptMode === "text"
                                    ? "bg-brand text-white"
                                    : "bg-white"
                            }`}
                            onClick={() => setTranscriptMode("text")}
                        >
                            <Pencil className="w-4 h-4" /> Paste Text
                        </button>

                        <button
                            className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
                                transcriptMode === "url"
                                    ? "bg-brand text-white"
                                    : "bg-white"
                            }`}
                            onClick={() => setTranscriptMode("url")}
                        >
                            <Link2 className="w-4 h-4" /> Transcript URL
                        </button>
                    </div>

                    {/* TRANSCRIPT FILE */}
                    {transcriptMode === "file" && (
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-slate-600">
                                Transcript File
                            </label>

                            <div className="border border-slate-200 rounded-card p-4 text-center cursor-pointer hover:bg-slate-50">
                                <label className="cursor-pointer flex flex-col items-center text-sm text-slate-600">
                                    <FileText className="w-6 h-6 text-slate-400" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".txt,.srt,.vtt"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                                setTranscriptFile(f);
                                                setTranscriptText("");
                                                setTranscriptUrl("");
                                            }
                                        }}
                                    />
                                    {transcriptFile
                                        ? transcriptFile.name
                                        : "Click to upload transcript"}
                                </label>
                            </div>

                            {transcriptFile && (
                                <button
                                    className="text-xs text-rose-500 hover:underline"
                                    onClick={() => setTranscriptFile(null)}
                                >
                                    Remove transcript
                                </button>
                            )}
                        </div>
                    )}

                    {/* TRANSCRIPT TEXT */}
                    {transcriptMode === "text" && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Transcript Text
                            </label>
                            <textarea
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 h-36"
                                value={transcriptText}
                                onChange={(e) => setTranscriptText(e.target.value)}
                                placeholder="Paste transcript text here..."
                            />
                        </div>
                    )}

                    {/* TRANSCRIPT URL */}
                    {transcriptMode === "url" && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Transcript URL
                            </label>
                            <Input
                                value={transcriptUrl}
                                onChange={(e) => setTranscriptUrl(e.target.value)}
                                placeholder="https://example.com/transcript.txt"
                            />
                        </div>
                    )}

                    {/* TRANSLATED SCRIPT */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Translated Transcript (optional)
                        </label>
                        <textarea
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 h-24"
                            value={translatedScript}
                            onChange={(e) => setTranslatedScript(e.target.value)}
                            placeholder="Paste translated transcript here..."
                        />
                    </div>

                    {/* START / END */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Start Time (s)
                            </label>
                            <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={startTime}
                                onChange={(e) => setStartTime(Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                End Time (s)
                            </label>
                            <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={endTime}
                                onChange={(e) => setEndTime(Number(e.target.value))}
                            />
                        </div>
                    </div>

                </div>

                {error && (
                    <div className="text-sm text-rose-600 mt-4">{error}</div>
                )}

                {/* FOOTER */}
                <div className="flex justify-end gap-2 mt-6">
                    <Btn.Secondary onClick={handleClose}>Cancel</Btn.Secondary>
                    <Btn.Primary onClick={handleCreate} disabled={creating}>
                        {creating ? "Creating..." : "Create Job"}
                    </Btn.Primary>
                </div>
            </div>
        </div>
    );
};
