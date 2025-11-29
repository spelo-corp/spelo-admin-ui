// src/pages/LessonViewPage.tsx
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import type {LessonDetail} from "../types.ts";
import {api} from "../api/client.ts";

export type LessonOutletContext = {
    lesson: LessonDetail | null;
    loading: boolean;
    reload: () => void;
};

const LessonViewPage: React.FC = () => {
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { label: "Lesson Info", path: "info" },
        { label: "Audio & Sentences", path: "audio" },
        { label: "Exercises", path: "exercises" },
        { label: "Vocabulary", path: "vocab" },
    ];

    const loadLesson = useCallback(async () => {
        if (!lessonId) return;
        setLoading(true);
        try {
            const res = await api.getLessonDetail(Number(lessonId));
            if (res.success) setLesson(res.lesson);
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        loadLesson();
    }, [loadLesson]);

    return (
        <div className="flex flex-col space-y-4">
            {/* PAGE TITLE */}
            <h1 className="text-2xl font-semibold text-slate-900">
                Lesson #{lessonId}
            </h1>

            {/* ONE CARD: tabs + content */}
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-slate-200 bg-white">
                    <div className="flex gap-1 px-2">
                        {tabs.map((t) => (
                            <NavLink
                                key={t.path}
                                to={`/admin/lesson/${lessonId}/${t.path}`}
                                className={({ isActive }) =>
                                    `
                    px-4 py-2 text-sm font-medium
                    transition-all -mb-px border-b-2
                    ${
                                        isActive
                                            ? "border-blue-500 text-blue-600 bg-white"
                                            : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                                    }
                  `
                                }
                            >
                                {t.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Sub page renders here, with context */}
                <div className="p-4">
                    <Outlet context={{ lesson, loading, reload: loadLesson }} />
                </div>
            </div>
        </div>
    );
};

export default LessonViewPage;
