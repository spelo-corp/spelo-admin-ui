// src/pages/lesson/LessonInfoPage.tsx
import { useOutletContext } from "react-router-dom";
import type { LessonOutletContext } from "../LessonViewPage";

const LessonInfoSkeleton = () => (
    <div className="space-y-3">
        <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
    </div>
);

const LessonInfoPage = () => {
    const { lesson, loading } = useOutletContext<LessonOutletContext>();

    if (loading) return <LessonInfoSkeleton />;
    if (!lesson) {
        return (
            <div className="text-sm text-rose-600">
                Lesson not found or failed to load.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">{lesson.name}</h2>

            {lesson.description && (
                <p className="text-sm text-slate-600">{lesson.description}</p>
            )}

            <div className="text-xs text-slate-500 space-x-2">
        <span>
          Level: <b>{lesson.level}</b>
        </span>
                {lesson.audio_files?.length != null && (
                    <span>
            • Audio files: <b>{lesson.audio_files.length}</b>
          </span>
                )}
            </div>
        </div>
    );
};

export default LessonInfoPage;
