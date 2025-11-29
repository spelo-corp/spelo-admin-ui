// src/pages/lesson/LessonAudioPage.tsx
import { useOutletContext } from "react-router-dom";
import type { LessonOutletContext } from "../LessonViewPage";
import type { Sentence } from "../../types";
import { WaveformPlayer } from "../../components/audio/WaveformPlayer";

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
    const { lesson, loading } = useOutletContext<LessonOutletContext>();

    if (loading) return <LessonAudioSkeleton />;
    if (!lesson) {
        return <div className="p-4 text-rose-600">Lesson not found.</div>;
    }

    const audio = lesson.audio_files?.[0];

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* AUDIO SECTION */}
            <div className="bg-white border rounded-xl p-4">
                <h2 className="font-medium text-sm mb-2">Audio</h2>

                {audio ? (
                    <>
                        <WaveformPlayer audioUrl={audio.url} height={80} />
                        <audio controls src={audio.url} className="w-full mt-2" />
                    </>
                ) : (
                    <div className="text-xs text-slate-500 italic">
                        No audio file uploaded for this lesson.
                    </div>
                )}
            </div>

            {/* SENTENCES SECTION */}
            <div className="bg-white border rounded-xl p-4 flex flex-col h-[75vh]">
                <h2 className="font-medium text-sm mb-2">Sentences</h2>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {(lesson.listening?.sentences || []).map(
                        (s: Sentence, index: number) => (
                            <div
                                key={index}
                                className="border border-slate-200 rounded-lg p-2 bg-slate-50"
                            >
                                <div className="text-xs text-slate-500 mb-1">
                                    {s.start_time.toFixed(2)}s → {s.end_time.toFixed(2)}s
                                </div>
                                <div className="font-medium text-sm">{s.text}</div>
                                {s.translated_text && (
                                    <div className="text-xs text-slate-600 mt-1">
                                        {s.translated_text}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonAudioPage;
