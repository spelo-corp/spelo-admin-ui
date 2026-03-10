// src/pages/LessonViewPage.tsx

import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Dumbbell,
    Info,
    Languages,
    Music,
    RefreshCcw,
    Workflow,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Lesson, LessonDetail } from "../types";

export interface LessonOutletContext {
    lessonDetail: LessonDetail | null;
    lessonMeta: Lesson | null;
    loading: boolean;
    setLessonDetail: React.Dispatch<React.SetStateAction<LessonDetail | null>>;
    setLessonMeta: React.Dispatch<React.SetStateAction<Lesson | null>>;
}

interface ConfirmResetModalProps {
    open: boolean;
    title: string;
    description: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
    open,
    title,
    description,
    loading,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-5 w-full max-w-md">
                <h2 className="text-sm font-semibold text-slate-900 mb-2">{title}</h2>
                <p className="text-xs text-slate-600 mb-4">{description}</p>

                <div className="flex justify-end gap-2 text-xs">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : "Confirm Reset"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LessonViewPage: React.FC = () => {
    const { lessonId } = useParams();
    const location = useLocation();

    const lessonFromState = (location.state as { lesson?: Lesson } | undefined)?.lesson ?? null;

    const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
    const [lessonMeta, setLessonMeta] = useState<Lesson | null>(lessonFromState);
    const [loading, setLoading] = useState(true);

    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    const tabs = [
        { label: "Lesson Info", path: "info", icon: Info },
        { label: "Audio & Sentences", path: "audio", icon: Music },
        { label: "Jobs", path: "jobs", icon: Workflow },
        { label: "Exercises", path: "exercises", icon: Dumbbell },
        { label: "Vocabulary", path: "vocab", icon: BookOpen },
    ];

    const loadLessonDetail = useCallback(async () => {
        if (!lessonId) return;
        setLoading(true);
        try {
            const res = await api.getLessonDetail(Number(lessonId), { size: 100 });
            if (res.success) {
                setLessonDetail(res.lesson);
                if (!lessonMeta && res.lesson) {
                    const lesson = res.lesson;
                    setLessonMeta(
                        (prev) =>
                            prev ?? {
                                id: lesson.lesson_id,
                                name: lesson.lesson_name,
                                level: lesson.level ?? "A1",
                                category_id: lesson.category_id ?? 0,
                                description: lesson.description,
                                status: lesson.status,
                                image: lesson.image,
                                gems: lesson.gems,
                            },
                    );
                }
            }
        } finally {
            setLoading(false);
        }
    }, [lessonId, lessonMeta]);

    const fetchLessonMeta = useCallback(async () => {
        if (lessonMeta || !lessonId) return;

        try {
            const res = await api.getAllLessons();
            if (res.success) {
                const found = res.lessons.find((item) => item.id === Number(lessonId));
                if (found) {
                    setLessonMeta(found);
                }
            }
        } catch {
            // ignore fallback lookup errors
        }
    }, [lessonId, lessonMeta]);

    useEffect(() => {
        void loadLessonDetail();
        void fetchLessonMeta();
    }, [loadLessonDetail, fetchLessonMeta]);

    const handleResetProgress = async () => {
        if (!lessonId) return;

        setResetting(true);
        setStatus({ type: null, message: "" });

        try {
            const res = await api.resetUserLessonProgress(Number(lessonId));

            setStatus({
                type: res.success ? "success" : "error",
                message: res.message || (res.success ? "Progress reset." : "Reset failed."),
            });
        } catch (e) {
            console.error(e);
            setStatus({
                type: "error",
                message: "Unexpected error while resetting progress.",
            });
        } finally {
            setResetting(false);
            setShowConfirmReset(false);
        }
    };

    const handleTranslateLesson = async () => {
        if (!lessonId) return;

        setTranslating(true);
        setStatus({ type: null, message: "" });

        try {
            const res = await api.translateLesson(Number(lessonId));

            if (res.success) {
                setStatus({
                    type: "success",
                    message: "Translation job created! Check the Jobs tab to track progress.",
                });
            } else {
                setStatus({
                    type: "error",
                    message: "Failed to start translation job.",
                });
            }
        } catch (e) {
            console.error(e);
            setStatus({
                type: "error",
                message: "Unexpected error while starting translation.",
            });
        } finally {
            setTranslating(false);
        }
    };

    const headerTitle = lessonMeta?.name ?? lessonDetail?.lesson_name ?? `Lesson #${lessonId}`;
    const levelLabel = lessonMeta?.level || "—";
    const statusValue = lessonMeta?.status;
    const isActive = statusValue === 1;

    return (
        <div className="flex flex-col h-full gap-4 px-8 py-6">
            {/* COMPACT HEADER BAR */}
            <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
                <Link
                    to="/admin/lessons"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 shrink-0"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Lessons
                </Link>

                <div className="w-px h-5 bg-slate-200" />

                <h1 className="text-lg font-semibold text-slate-900 truncate">{headerTitle}</h1>

                <span className="text-xs text-slate-400 shrink-0">#{lessonId}</span>

                <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium shrink-0">
                    {levelLabel}
                </span>

                {statusValue !== undefined && (
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                            isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                        }`}
                    >
                        {isActive ? "Active" : "Inactive"}
                    </span>
                )}

                {/* Spacer */}
                <div className="flex-1 min-w-0" />

                {/* Status message */}
                {status.type && (
                    <div
                        className={`flex items-center gap-1.5 text-xs shrink-0 ${
                            status.type === "success" ? "text-emerald-600" : "text-rose-600"
                        }`}
                    >
                        {status.type === "success" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        <span className="max-w-[260px] truncate">{status.message}</span>
                    </div>
                )}

                {/* Action buttons */}
                <button
                    type="button"
                    onClick={handleTranslateLesson}
                    disabled={translating || loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    <Languages className={`w-3.5 h-3.5 ${translating ? "animate-pulse" : ""}`} />
                    {translating ? "Translating..." : "Translate"}
                </button>

                <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    disabled={resetting || loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
                    {resetting ? "Resetting..." : "Reset"}
                </button>
            </div>

            {/* BODY */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex-1 flex flex-col">
                {/* TABS BAR */}
                <div className="bg-slate-50 border-b border-slate-100">
                    <div className="flex gap-1 px-2">
                        {tabs.map((t) => (
                            <NavLink
                                key={t.path}
                                to={`/admin/lessons/${lessonId}/${t.path}`}
                                className={({ isActive: active }) =>
                                    `inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-xl transition-all ${
                                        active
                                            ? "bg-white border border-slate-200 border-b-white text-slate-900 shadow-sm"
                                            : "text-slate-600 hover:bg-white"
                                    }`
                                }
                            >
                                <t.icon className="w-3.5 h-3.5" />
                                {t.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="bg-white p-4 flex-1">
                    <Outlet
                        context={
                            {
                                lessonDetail,
                                lessonMeta,
                                loading,
                                setLessonDetail,
                                setLessonMeta,
                            } satisfies LessonOutletContext
                        }
                    />
                </div>
            </div>

            {/* CONFIRM MODAL */}
            <ConfirmResetModal
                open={showConfirmReset}
                loading={resetting}
                title="Reset user progress?"
                description="This will reset the current user's progress for this lesson."
                onConfirm={handleResetProgress}
                onCancel={() => setShowConfirmReset(false)}
            />
        </div>
    );
};

export default LessonViewPage;
