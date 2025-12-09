// src/pages/LessonViewPage.tsx
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import type { LessonDetail } from "../types";
import { CloudUpload, CheckCircle2, AlertCircle } from "lucide-react";

export interface LessonOutletContext {
    lesson: LessonDetail | null;
    loading: boolean;
    setLesson: React.Dispatch<React.SetStateAction<LessonDetail | null>>;
}

// confirm modal as before...
interface ConfirmSyncModalProps {
    open: boolean;
    title: string;
    description: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmSyncModal: React.FC<ConfirmSyncModalProps> = ({
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
                        {loading ? "Syncing..." : "Confirm Sync"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LessonViewPage: React.FC = () => {
    const { lessonId } = useParams();

    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const [showConfirmSync, setShowConfirmSync] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

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

    const handleSync = async () => {
        if (!lessonId) return;

        setSyncing(true);
        setSyncStatus({ type: null, message: "" });

        try {
            const res = await api.syncLesson(Number(lessonId));

            if (res?.success !== false) {
                setSyncStatus({
                    type: "success",
                    message: res?.message || "Lesson synced successfully.",
                });
            } else {
                setSyncStatus({
                    type: "error",
                    message: res?.message || "Sync failed.",
                });
            }
        } catch (e) {
            console.error(e);
            setSyncStatus({
                type: "error",
                message: "Unexpected error while syncing.",
            });
        } finally {
            setSyncing(false);
            setShowConfirmSync(false);
        }
    };

    const headerTitle = lesson?.name || `Lesson #${lessonId}`;
    const levelLabel = lesson?.level || "—";
    const categoryLabel = lesson?.category_id ? `Category ${lesson.category_id}` : "Uncategorized";

    return (
        <div className="flex flex-col h-full gap-4">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-800 to-sky-600 text-white p-6 shadow-card">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -left-10 bottom-0 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/70">Lesson Detail</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-semibold">{headerTitle}</h1>
                            <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white/15 border border-white/25">
                                ID #{lessonId}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                            <span className="px-3 py-1 rounded-full bg-white/15 border border-white/15">
                                Level: {levelLabel}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/12 border border-white/15">
                                {categoryLabel}
                            </span>
                            {lesson?.status !== undefined && (
                                <span className="px-3 py-1 rounded-full bg-white/12 border border-white/15">
                                    {lesson.status === 1 ? "Active" : "Inactive"}
                                </span>
                            )}
                        </div>

                        {syncStatus.type && (
                            <div
                                className={`flex items-center gap-2 text-xs ${
                                    syncStatus.type === "success" ? "text-emerald-200" : "text-rose-200"
                                }`}
                            >
                                {syncStatus.type === "success" ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                <span>{syncStatus.message}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowConfirmSync(true)}
                            disabled={syncing || loading}
                            className="
                                inline-flex items-center gap-1.5
                                px-4 py-2 rounded-full text-sm font-semibold
                                bg-white text-slate-900
                                shadow-md shadow-black/10
                                hover:bg-slate-50
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            <CloudUpload className="w-4 h-4" />
                            {syncing ? "Syncing..." : "Sync to Legacy"}
                        </button>
                    </div>
                </div>
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
                                className={({ isActive }) =>
                                    `
                                        px-4 py-2 text-sm font-medium
                                        rounded-t-xl
                                        transition-all
                                        ${
                                        isActive
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
                                lesson,
                                loading,
                                setLesson,
                            } satisfies LessonOutletContext
                        }
                    />
                </div>
            </div>

            {/* CONFIRM MODAL */}
            <ConfirmSyncModal
                open={showConfirmSync}
                loading={syncing}
                title="Sync lesson to legacy database?"
                description="This will push the current lesson data to the legacy system. If a lesson with the same ID already exists there, its content may be overwritten."
                onConfirm={handleSync}
                onCancel={() => setShowConfirmSync(false)}
            />
        </div>
    );
};

export default LessonViewPage;
