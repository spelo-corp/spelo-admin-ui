// src/pages/lesson/LessonAudioPage.tsx
import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { Pencil, X, Save, Loader2 } from "lucide-react";
import type { LessonOutletContext } from "../LessonViewPage";
import { api } from "../../api/client";
import type { ListeningLessonDTO } from "../../types";

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

const LessonAudioPage = () => {
    const { lessonDetail, loading, setLessonDetail } = useOutletContext<LessonOutletContext>();
    const [editingSentence, setEditingSentence] = useState<ListeningLessonDTO | null>(null);

    if (loading) return <LessonAudioSkeleton />;
    if (!lessonDetail) {
        return <div className="p-4 text-rose-600">Lesson not found.</div>;
    }

    const listeningLessons = lessonDetail.lesson_details ?? [];

    if (listeningLessons.length === 0) {
        return (
            <div className="p-4 bg-white border rounded-xl text-sm text-slate-600">
                No listening lessons have been created for this lesson yet.
            </div>
        );
    }

    const handleSaveSentence = async (id: number, data: any) => {
        await api.updateListeningLesson(id, data);
        // Refresh lesson detail
        const res = await api.getLessonDetail(lessonDetail.lesson_id);
        if (res.success && res.lesson) {
            setLessonDetail(res.lesson);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {listeningLessons.map((detail) => {
                    const transcript =
                        detail.str_script ||
                        detail.script
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
                                        onClick={() => setEditingSentence(detail)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Edit sentence"
                                    >
                                        <Pencil className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {detail.data?.audio ? (
                                <audio controls src={detail.data.audio} className="w-full rounded-lg bg-slate-50" />
                            ) : (
                                <div className="text-xs text-slate-500 italic">
                                    No audio attached for this exercise.
                                </div>
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
                })}
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
        </>
    );
};

export default LessonAudioPage;
