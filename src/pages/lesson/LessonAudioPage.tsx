// src/pages/lesson/LessonAudioPage.tsx
import { useOutletContext } from "react-router-dom";
import type { LessonOutletContext } from "../LessonViewPage";

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

const LessonAudioPage = () => {
    const { lessonDetail, loading } = useOutletContext<LessonOutletContext>();

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

    return (
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
                            <div className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                Status {detail.status}
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
    );
};

export default LessonAudioPage;
