// src/pages/lesson/LessonAudioPage.tsx
import { useOutletContext } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Pencil, X, Save, Loader2, Upload, Scissors, Check, AlertCircle, Play, Square, Music, Youtube } from "lucide-react";
import type { LessonOutletContext } from "../LessonViewPage";
import { api } from "../../api/client";
import type { ListeningLessonDTO } from "../../types";
import { WaveformRegionsPlayer } from "../../components/audio/WaveformRegionsPlayer";
import { PresignedAudioPlayer } from "../../components/audio/PresignedAudioPlayer";
import { usePresignedAudioUrl } from "../../hooks/usePresignedAudioUrl";

const LessonAudioSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {/* Audio Skeleton */}
        <div className="bg-white border rounded-xl p-4 space-y-4">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-[80px] bg-slate-200 rounded animate-pulse" />
            <div className="h-6 bg-slate-200 rounded animate-pulse w-1/2" />
        </div>

        {/* Sentence Skeleton */}
        <div className="bg-white border rounded-xl p-4 space-y-4 flex flex-col">
            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={i}
                        className="border rounded-lg p-3 bg-slate-50 animate-pulse space-y-2"
                    >
                        <div className="h-3 bg-slate-200 rounded w-1/3" />
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

interface EditModalProps {
    isOpen: boolean;
    sentence: ListeningLessonDTO;
    lessonId: number;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

const EditSentenceModal: React.FC<EditModalProps> = ({ isOpen, sentence, lessonId, onClose, onSave }) => {
    const [originalScript, setOriginalScript] = useState(sentence.str_script || "");
    const [translatedScript, setTranslatedScript] = useState(sentence.translated_script || "");
    const [startTime, setStartTime] = useState(sentence.data?.start ?? 0);
    const [endTime, setEndTime] = useState(sentence.data?.end ?? 0);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                lesson_id: lessonId,
                original_script: originalScript,
                translated_script: translatedScript,
                type: sentence.type,
                lesson_scripts: sentence.script,
                data: {
                    ...sentence.data,
                    start: startTime,
                    end: endTime,
                },
            });
            onClose();
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Edit Sentence #{sentence.id}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                        disabled={saving}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Original Script
                        </label>
                        <textarea
                            value={originalScript}
                            onChange={(e) => setOriginalScript(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
                            rows={3}
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Translated Script
                        </label>
                        <textarea
                            value={translatedScript}
                            onChange={(e) => setTranslatedScript(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
                            rows={3}
                            disabled={saving}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Start Time (seconds)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={startTime}
                                onChange={(e) => setStartTime(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                End Time (seconds)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={endTime}
                                onChange={(e) => setEndTime(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                disabled={saving}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
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
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AudioCutterModalProps {
    isOpen: boolean;
    sentence: ListeningLessonDTO;
    lessonId: number;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

const AudioCutterModal: React.FC<AudioCutterModalProps> = ({ isOpen, sentence, lessonId, onClose, onSave }) => {
    const [startTime, setStartTime] = useState(sentence.data?.start ?? 0);
    const [endTime, setEndTime] = useState(sentence.data?.end ?? 0);
    const [saving, setSaving] = useState(false);

    // Fetch presigned URL for the audio
    const originalAudioUrl = sentence.data?.audio;
    const { url: presignedAudioUrl, loading: loadingUrl } = usePresignedAudioUrl(originalAudioUrl);

    if (!isOpen) return null;

    if (!originalAudioUrl) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl">
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                        <p>No audio file available for this sentence.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const handleRegionUpdate = (_id: string, start: number, end: number) => {
        setStartTime(start);
        setEndTime(end);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                lesson_id: lessonId,
                original_script: sentence.str_script,
                translated_script: sentence.translated_script,
                type: sentence.type,
                lesson_scripts: sentence.script,
                data: {
                    ...sentence.data,
                    start: startTime,
                    end: endTime,
                },
            });
            onClose();
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        <Scissors className="w-5 h-5 inline mr-2" />
                        Cut Audio - Sentence #{sentence.id}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                        disabled={saving}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Audio Waveform */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                        <p className="text-sm font-medium text-slate-700 mb-3">
                            Drag the region to select the audio segment
                        </p>
                        {loadingUrl || !presignedAudioUrl ? (
                            <div className="h-[120px] flex items-center justify-center bg-slate-100 rounded text-slate-400 text-sm">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Loading audio...
                            </div>
                        ) : (
                            <WaveformRegionsPlayer
                                audioUrl={presignedAudioUrl}
                                regions={[
                                    {
                                        id: "segment",
                                        start: startTime,
                                        end: endTime,
                                        color: "rgba(14, 165, 233, 0.3)",
                                    },
                                ]}
                                onRegionUpdate={handleRegionUpdate}
                                height={120}
                                editable={true}
                            />
                        )}
                    </div>

                    {/* Time Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Start Time (seconds)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={startTime}
                                onChange={(e) => setStartTime(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                End Time (seconds)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={endTime}
                                onChange={(e) => setEndTime(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {/* Duration Display */}
                    <div className="text-sm text-slate-600">
                        Duration: <span className="font-medium">{(endTime - startTime).toFixed(2)}s</span>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
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
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ReviewAudioModalProps {
    isOpen: boolean;
    file: File;
    onClose: () => void;
    onUpload: (file: File, start?: number, end?: number) => Promise<void>;
}

const ReviewAudioModal: React.FC<ReviewAudioModalProps> = ({ isOpen, file, onClose, onUpload }) => {
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0); // Will be set to duration on load
    const [uploading, setUploading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const wsRef = useRef<any>(null);

    // Create object URL for the file
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Creates a blob URL for the file to prevent strict mode issues
    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setAudioUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    if (!isOpen) return null;

    const handleReady = (ws: any) => {
        wsRef.current = ws;
        const duration = ws.getDuration();
        setEndTime(duration);

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));
    };

    const handleRegionUpdate = (_id: string, start: number, end: number) => {
        setStartTime(start);
        setEndTime(end);
    };

    const togglePlay = () => {
        if (wsRef.current) {
            if (isPlaying) {
                wsRef.current.pause();
            } else {
                wsRef.current.play(startTime, endTime);
            }
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            await onUpload(file, startTime, endTime);
            onClose();
        } catch (error) {
            console.error("Upload failed in modal:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        <Scissors className="w-5 h-5 inline mr-2" />
                        Review & Cut Audio
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                        disabled={uploading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-700">Preview: {file.name}</p>
                            <button
                                onClick={togglePlay}
                                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                            >
                                {isPlaying ? (
                                    <>
                                        <div className="w-2 h-2 bg-slate-600 rounded-sm" /> Pause
                                    </>
                                ) : (
                                    <>
                                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-slate-600 border-b-[4px] border-b-transparent ml-0.5" /> Play Region
                                    </>
                                )}
                            </button>
                        </div>

                        {audioUrl ? (
                            <WaveformRegionsPlayer
                                audioUrl={audioUrl}
                                regions={[
                                    {
                                        id: "cut-region",
                                        start: startTime,
                                        end: endTime,
                                        color: "rgba(14, 165, 233, 0.3)",
                                    },
                                ]}
                                onRegionUpdate={handleRegionUpdate}
                                onReady={handleReady}
                                height={120}
                                editable={true}
                            />
                        ) : (
                            <div className="h-[120px] flex items-center justify-center bg-slate-100 rounded text-slate-400 text-sm">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Loading Audio...
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Start Cut (seconds)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={startTime}
                                onChange={(e) => setStartTime(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                disabled={uploading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                End Cut (seconds)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={endTime}
                                onChange={(e) => setEndTime(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>Only the selected region ({startTime.toFixed(2)}s - {endTime.toFixed(2)}s) will be used for the lesson.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Update Audio
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface MainAudioEditorProps {
    audioUrl: string | null | undefined;
    lessonId: number;
    onUpdate: () => Promise<void>;
}

const MainAudioEditor: React.FC<MainAudioEditorProps> = ({ audioUrl, lessonId, onUpdate }) => {
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trimming, setTrimming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const wsRef = useRef<any>(null);

    // Fetch presigned URL for the audio
    const { url: presignedAudioUrl, loading: loadingUrl } = usePresignedAudioUrl(audioUrl);

    const handleReady = (ws: any) => {
        wsRef.current = ws;
        const duration = ws.getDuration();
        if (duration > 0 && endTime === 0) {
            setEndTime(duration);
        }

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));
    };

    const handleRegionUpdate = (_id: string, start: number, end: number) => {
        setStartTime(start);
        setEndTime(end);
    };

    const togglePlay = () => {
        if (wsRef.current) {
            if (isPlaying) {
                wsRef.current.pause();
            } else {
                wsRef.current.play(startTime, endTime);
            }
        }
    };

    const handleTrim = async () => {
        if (!audioUrl) return;

        if (endTime <= startTime) {
            setError("End time must be greater than start time.");
            return;
        }

        setTrimming(true);
        setError(null);
        setSuccess(null);

        try {
            // Fetch the audio file and re-upload with trim parameters
            const response = await fetch(presignedAudioUrl || audioUrl);
            const blob = await response.blob();
            const file = new File([blob], "audio.mp3", { type: blob.type });

            const result = await api.uploadLessonAudio(lessonId, file, startTime, endTime);

            if (result.success) {
                setSuccess(`Audio trimmed successfully! Updated ${result.updatedCount} sentence(s).`);
                await onUpdate();
                setTimeout(() => setSuccess(null), 5000);
            } else {
                setError(result.message || "Failed to trim audio");
            }
        } catch (err) {
            console.error("Trim error:", err);
            setError(err instanceof Error ? err.message : "Failed to trim audio");
        } finally {
            setTrimming(false);
        }
    };

    if (!audioUrl) {
        return (
            <div className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                    <Music className="w-5 h-5" />
                    <span className="text-sm">No main audio available. Upload audio to get started.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Main Audio Editor
                    </h3>
                    <p className="text-xs text-slate-500">
                        Preview and trim the lesson's main audio file.
                    </p>
                </div>
            </div>

            {/* Waveform Player */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-600">
                        Drag the region to select the audio segment to keep
                    </p>
                    <button
                        onClick={togglePlay}
                        disabled={loadingUrl || !presignedAudioUrl}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isPlaying ? (
                            <>
                                <Square className="w-3 h-3" /> Pause
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3" /> Play Region
                            </>
                        )}
                    </button>
                </div>

                {loadingUrl ? (
                    <div className="h-[100px] flex items-center justify-center bg-slate-100 rounded text-slate-400 text-sm">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Loading audio...
                    </div>
                ) : presignedAudioUrl ? (
                    <WaveformRegionsPlayer
                        audioUrl={presignedAudioUrl}
                        regions={[
                            {
                                id: "main-region",
                                start: startTime,
                                end: endTime,
                                color: "rgba(14, 165, 233, 0.3)",
                            },
                        ]}
                        onRegionUpdate={handleRegionUpdate}
                        onReady={handleReady}
                        height={100}
                        editable={true}
                    />
                ) : (
                    <div className="h-[100px] flex items-center justify-center bg-slate-100 rounded text-rose-500 text-sm">
                        Failed to load audio
                    </div>
                )}
            </div>

            {/* Trim Controls */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        Start Time (s)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={startTime}
                        onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled={trimming}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        End Time (s)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={endTime}
                        onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled={trimming}
                    />
                </div>
            </div>

            {/* Duration */}
            <div className="text-xs text-slate-500">
                Selected duration: <span className="font-medium">{(endTime - startTime).toFixed(2)}s</span>
            </div>

            {/* Trim Button */}
            <button
                onClick={handleTrim}
                disabled={trimming || !presignedAudioUrl}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {trimming ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Trimming...
                    </>
                ) : (
                    <>
                        <Scissors className="w-4 h-4" />
                        Trim & Update Audio
                    </>
                )}
            </button>

            {/* Success Message */}
            {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-700">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}
        </div>
    );
};

interface YouTubeSectionProps {
    lessonId: number;
    onJobCreated: () => void;
}

const YouTubeSection: React.FC<YouTubeSectionProps> = ({ lessonId, onJobCreated }) => {
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [transcript, setTranscript] = useState("");
    const [mode, setMode] = useState<"auto" | "captions" | "manual">("auto");
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Extract video ID for preview
    const videoIdMatch = youtubeUrl.match(
        /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    );
    const videoId = videoIdMatch?.[1] ?? (youtubeUrl.match(/^[a-zA-Z0-9_-]{11}$/) ? youtubeUrl : null);

    const handleSubmit = async () => {
        if (!youtubeUrl.trim()) {
            setError("Please enter a YouTube URL");
            return;
        }
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const payload: Parameters<typeof api.createYouTubeLesson>[1] = {
                youtubeUrl: youtubeUrl.trim(),
            };
            if (mode === "manual" && transcript.trim()) {
                payload.transcript = transcript.trim();
            }
            if (mode !== "auto") {
                payload.transcriptSource = mode;
            }
            if (startTime) payload.startTime = parseFloat(startTime);
            if (endTime) payload.endTime = parseFloat(endTime);

            const result = await api.createYouTubeLesson(lessonId, payload);
            if (result.success && result.data) {
                setSuccess(`YouTube processing job #${result.data.id} created. Check the Jobs tab for progress.`);
                onJobCreated();
            } else {
                setError(result.message || "Failed to create YouTube job");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create YouTube job");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-semibold text-slate-900">YouTube Source</h3>
            </div>
            <p className="text-xs text-slate-600">
                Paste a YouTube URL to create dictation lessons from the video audio.
            </p>

            {/* URL Input */}
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                    YouTube URL
                </label>
                <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or video ID"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    disabled={submitting}
                />
            </div>

            {/* Preview */}
            {videoId && (
                <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border border-slate-200">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube preview"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => setMode("auto")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        mode === "auto"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    disabled={submitting}
                >
                    Auto-transcribe
                </button>
                <button
                    type="button"
                    onClick={() => setMode("captions")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        mode === "captions"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    disabled={submitting}
                >
                    YouTube Captions
                </button>
                <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        mode === "manual"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    disabled={submitting}
                >
                    Provide transcript
                </button>
            </div>

            {/* Captions mode info */}
            {mode === "captions" && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>Will extract subtitles from the YouTube video. Falls back to auto-transcribe if no captions are available.</p>
                </div>
            )}

            {/* Transcript input (manual mode) */}
            {mode === "manual" && (
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        Transcript
                    </label>
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Paste transcript here. Each sentence should be on a new line or separated by periods."
                        rows={6}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y"
                        disabled={submitting}
                    />
                </div>
            )}

            {/* Optional time range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        Start Time (seconds, optional)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled={submitting}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        End Time (seconds, optional)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="Full video"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        disabled={submitting}
                    />
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={submitting || !youtubeUrl.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
                {submitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Youtube className="w-4 h-4" />
                        Process YouTube Video
                    </>
                )}
            </button>

            {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-700">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                </div>
            )}

            {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}
        </div>
    );
};

const LessonAudioPage = () => {
    const { lessonDetail, loading, setLessonDetail } = useOutletContext<LessonOutletContext>();
    const [editingSentence, setEditingSentence] = useState<ListeningLessonDTO | null>(null);
    const [cuttingSentence, setCuttingSentence] = useState<ListeningLessonDTO | null>(null);
    const [reviewFile, setReviewFile] = useState<File | null>(null);

    // Kept for global error display if needed, but mostly handled in modal now
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (loading) return <LessonAudioSkeleton />;
    if (!lessonDetail) {
        return <div className="p-4 text-rose-600">Lesson not found.</div>;
    }

    const listeningLessons = lessonDetail.lesson_details ?? [];

    // Extract main audio URL from the first sentence (all sentences share the same audio URL)
    const mainAudioUrl = listeningLessons.length > 0 ? listeningLessons[0].data?.audio : null;

    // Refresh lesson detail
    const refreshLessonDetail = async () => {
        const res = await api.getLessonDetail(lessonDetail.lesson_id);
        if (res.success && res.lesson) {
            setLessonDetail(res.lesson);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            setUploadError("Please select a valid audio file");
            return;
        }

        setUploadError(null);
        setUploadSuccess(null);
        setReviewFile(file);

        // Reset input so same file can be selected again if cancelled
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleConfirmUpload = async (file: File, start?: number, end?: number) => {
        try {
            const result = await api.uploadLessonAudio(lessonDetail.lesson_id, file, start, end);

            if (result.success) {
                setUploadSuccess(
                    `Audio updated successfully! Updated ${result.updatedCount} sentence(s).`
                );

                // Refresh lesson detail
                await refreshLessonDetail();

                // Auto-dismiss success message after 5 seconds
                setTimeout(() => setUploadSuccess(null), 5000);
            } else {
                setUploadError(result.message || "Failed to upload audio");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadError(error instanceof Error ? error.message : "Failed to upload audio");
            // Re-throw to let modal know it failed
            throw error;
        }
    };

    const handleSaveSentence = async (id: number, data: any) => {
        await api.updateListeningLesson(id, data);
        // Refresh lesson detail
        await refreshLessonDetail();
    };

    return (
        <>
            <div className="space-y-4">
                {/* Main Audio Editor Section */}
                <MainAudioEditor
                    audioUrl={mainAudioUrl}
                    lessonId={lessonDetail.lesson_id}
                    onUpdate={refreshLessonDetail}
                />

                {/* Upload Section */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">
                                Upload New Audio for Entire Lesson
                            </h3>
                            <p className="text-xs text-slate-600 mb-3">
                                Upload an audio file. You will be able to review and cut the audio before updating.
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="audio-upload"
                            />

                            <label
                                htmlFor="audio-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors bg-slate-900 text-white hover:bg-slate-800"
                            >
                                <Upload className="w-4 h-4" />
                                Select Audio File
                            </label>

                            {/* Success Message */}
                            {uploadSuccess && (
                                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-700">
                                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{uploadSuccess}</span>
                                </div>
                            )}

                            {/* Error Message */}
                            {uploadError && (
                                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{uploadError}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* YouTube Section */}
                <YouTubeSection
                    lessonId={lessonDetail.lesson_id}
                    onJobCreated={refreshLessonDetail}
                />

                {/* Sentences List */}
                {listeningLessons.length === 0 ? (
                    <div className="p-4 bg-white border rounded-xl text-sm text-slate-600">
                        No listening lessons have been created for this lesson yet.
                    </div>
                ) : (
                    listeningLessons.map((detail) => {
                        const transcript =
                            detail.str_script ||
                            (detail.script || [])
                                .map((word) => word.w)
                                .filter((word): word is string => Boolean(word))
                                .join(" ");

                        return (
                            <div key={detail.id} className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                            Exercise #{detail.id} • Type {detail.type}
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {transcript || "No transcript provided"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                            Status {detail.status}
                                        </div>
                                        <button
                                            onClick={() => setCuttingSentence(detail)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Cut audio"
                                            disabled={!detail.data?.audio}
                                        >
                                            <Scissors className={`w-4 h-4 ${detail.data?.audio ? 'text-blue-600' : 'text-slate-300'}`} />
                                        </button>
                                        <button
                                            onClick={() => setEditingSentence(detail)}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Edit sentence"
                                        >
                                            <Pencil className="w-4 h-4 text-slate-600" />
                                        </button>
                                    </div>
                                </div>

                                {detail.type === 3 && detail.data?.youtube_video_id ? (
                                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                                        <Youtube className="w-4 h-4" />
                                        YouTube: {detail.data.youtube_video_id}
                                    </div>
                                ) : (
                                    <PresignedAudioPlayer src={detail.data?.audio} />
                                )}

                                {(detail.data?.start !== undefined || detail.data?.end !== undefined) && (
                                    <div className="text-xs text-slate-500">
                                        {detail.data?.start ?? "—"}s → {detail.data?.end ?? "—"}s
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 rounded-lg bg-slate-50">
                                        <p className="text-[11px] uppercase text-slate-500 mb-1">Transcript</p>
                                        <p className="text-slate-800 leading-relaxed">{transcript || "—"}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50">
                                        <p className="text-[11px] uppercase text-slate-500 mb-1">Translation</p>
                                        <p className="text-slate-800 leading-relaxed">
                                            {detail.translated_script || "—"}
                                        </p>
                                    </div>
                                </div>

                                {detail.new_words?.length ? (
                                    <div className="p-3 rounded-lg bg-slate-50 space-y-2">
                                        <p className="text-[11px] uppercase text-slate-500">New Words</p>
                                        <div className="flex flex-wrap gap-2">
                                            {detail.new_words.map((word) => (
                                                <span
                                                    key={word.id}
                                                    className="text-xs px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-700"
                                                >
                                                    {word.word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>

            {editingSentence && (
                <EditSentenceModal
                    isOpen={!!editingSentence}
                    sentence={editingSentence}
                    lessonId={lessonDetail.lesson_id}
                    onClose={() => setEditingSentence(null)}
                    onSave={(data) => handleSaveSentence(editingSentence.id, data)}
                />
            )}

            {cuttingSentence && (
                <AudioCutterModal
                    isOpen={!!cuttingSentence}
                    sentence={cuttingSentence}
                    lessonId={lessonDetail.lesson_id}
                    onClose={() => setCuttingSentence(null)}
                    onSave={(data) => handleSaveSentence(cuttingSentence.id, data)}
                />
            )}

            {reviewFile && (
                <ReviewAudioModal
                    isOpen={!!reviewFile}
                    file={reviewFile}
                    onClose={() => setReviewFile(null)}
                    onUpload={handleConfirmUpload}
                />
            )}
        </>
    );
};

export default LessonAudioPage;
