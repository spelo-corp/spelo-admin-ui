import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ArrowLeft } from "lucide-react";
import { WaveformPlayer } from "../components/audio/WaveformPlayer";
import type {LessonDetail, Sentence} from "../types.ts";

const LessonViewPage: React.FC = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lessonId) return;

        (async () => {
            setLoading(true);
            try {
                const res = await api.getLessonDetail(Number(lessonId));
                if (res.success) setLesson(res.lesson);
            } finally {
                setLoading(false);
            }
        })();
    }, [lessonId]);

    if (loading) return <div className="p-6">Loading lesson...</div>;
    if (!lesson) return <div className="p-6 text-rose-600">Lesson not found.</div>;

    const audio = lesson.audio_files?.[0];

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <button
                className="text-slate-500 text-xs flex items-center gap-1"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h1 className="text-3xl font-semibold text-slate-900">
                {lesson.name}
            </h1>

            <p className="text-slate-600">{lesson.description}</p>

            {/* AUDIO SECTION */}
            {audio && (
                <div className="bg-white rounded-xl p-4 border">
                    <h2 className="font-semibold text-slate-800 mb-2 text-sm">Audio</h2>
                    <WaveformPlayer audioUrl={audio.url} height={80} />
                    <audio controls src={audio.url} className="w-full mt-2" />
                </div>
            )}

            {/* SENTENCES */}
            <div className="bg-white border rounded-xl p-4">
                <h2 className="font-semibold text-slate-800 mb-3 text-sm">
                    Sentences ({lesson.listening?.sentences?.length ?? 0})
                </h2>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {(lesson.listening?.sentences || []).map((s: Sentence, index: number) => (
                        <div
                            key={index}
                            className="border border-slate-200 rounded-xl p-3 bg-slate-50"
                        >
                            <div className="text-xs text-slate-500 mb-1">
                                {s.start_time.toFixed(2)}s → {s.end_time.toFixed(2)}s
                            </div>

                            <p className="font-medium text-slate-800 text-sm">{s.text}</p>

                            {s.translated_text && (
                                <p className="text-xs text-slate-600 mt-1">
                                    {s.translated_text}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LessonViewPage;
