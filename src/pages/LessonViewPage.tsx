// src/pages/LessonViewPage.tsx
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import type { Lesson, LessonDetail } from "../types";
import { AlertCircle, CheckCircle2, RefreshCcw, Languages } from "lucide-react";
import PageHeader from "../components/common/PageHeader";

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
                <h2 className="text-sm font-semibold text-slate-900 mb-2">
                    {title}
                </h2>
                <p className="text-xs text-slate-600 mb-4">{description}</p>

                <div className="flex justify-end gap-2 text-xs">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
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

    const lessonFromState =
        (location.state as { lesson?: Lesson } | undefined)?.lesson ?? null;

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
        { label: "Lesson Info", path: "info" },
        { label: "Audio & Sentences", path: "audio" },
        { label: "Jobs", path: "jobs" },
        { label: "Exercises", path: "exercises" },
        { label: "Vocabulary", path: "vocab" },
    ];

    const loadLessonDetail = useCallback(async () => {
        if (!lessonId) return;
        setLoading(true);
        try {
            const res = await api.getLessonDetail(Number(lessonId));
            if (res.success) {
                setLessonDetail(res.lesson);
                if (!lessonMeta && res.lesson) {
                    const lesson = res.lesson;
                    setLessonMeta((prev) =>
                        prev ?? {
                            id: lesson.lesson_id,
                            name: lesson.lesson_name,
                            level: lesson.level ?? "A1",
                            category_id: lesson.category_id ?? 0,
                            description: lesson.description,
                            status: lesson.status,
                            image: lesson.image,
                            gems: lesson.gems,
                        }
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
                const found = res.lessons.find(
                    (item) => item.id === Number(lessonId)
                );
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

    const headerTitle =
        lessonMeta?.name ?? lessonDetail?.lesson_name ?? `Lesson #${lessonId}`;
    const levelLabel = lessonMeta?.level || "—";
    const categoryLabel = lessonMeta?.category_id
        ? `Category ${lessonMeta.category_id}`
        : "Uncategorized";
    const statusValue = lessonMeta?.status;

    return (
        <div className="flex flex-col h-full gap-8 px-8 py-6">
            {/* HERO */}
            <PageHeader
                badge={
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        Lesson Detail
                    </div>
                }
                title={headerTitle}
                titleAddon={
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white/10 border border-white/20">
                        ID #{lessonId}
                    </span>
                }
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleTranslateLesson}
                            disabled={translating || loading}
                            className="
                                inline-flex items-center gap-1.5
                                px-4 py-2 rounded-full text-sm font-semibold
                                bg-white text-slate-900
                                shadow-md shadow-black/10
                                hover:bg-slate-50
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            <Languages className={`w-4 h-4 ${translating ? "animate-pulse" : ""}`} />
                            {translating ? "Translating..." : "Translate Lesson"}
                        </button>
                        <button
                            onClick={() => setShowConfirmReset(true)}
                            disabled={resetting || loading}
                            className="
                                inline-flex items-center gap-1.5
                                px-4 py-2 rounded-full text-sm font-semibold
                                bg-white text-slate-900
                                shadow-md shadow-black/10
                                hover:bg-slate-50
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            <RefreshCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
                            {resetting ? "Resetting..." : "Reset Progress"}
                        </button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                            Level: {levelLabel}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                            {categoryLabel}
                        </span>
                        {statusValue !== undefined && (
                            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                                {statusValue === 1 ? "Active" : "Inactive"}
                            </span>
                        )}
                    </div>

                    {status.type && (
                        <div
                            className={`flex items-center gap-2 text-xs ${status.type === "success" ? "text-emerald-200" : "text-rose-200"
                                }`}
                        >
                            {status.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            <span>{status.message}</span>
                        </div>
                    )}
                </div>
            </PageHeader>

            {/* BODY */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex-1 flex flex-col">
                {/* TABS BAR */}
                <div className="bg-slate-50 border-b border-slate-100">
                    <div className="flex gap-1 px-2">
                        {tabs.map((t) => (
                            <NavLink
                                key={t.path}
                                to={`/admin/lessons/${lessonId}/${t.path}`}
                                className={({ isActive }) =>
                                    `
                                        px-4 py-2 text-sm font-medium
                                        rounded-t-xl
                                        transition-all
                                        ${isActive
                                        ? "bg-white border border-slate-200 border-b-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:bg-white"
                                    }
                                    `
                                }
                            >
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
