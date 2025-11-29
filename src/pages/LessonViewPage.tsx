// src/pages/LessonViewPage.tsx
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import type { LessonDetail } from "../types";
import { CloudUpload, CheckCircle2, AlertCircle } from "lucide-react";

export interface LessonOutletContext {
    lesson: LessonDetail | null;
    loading: boolean;
}

/** -------- Simple Confirm Modal for Sync -------- */
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

/** ---------------- Main Lesson View Page ---------------- */
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

    // -------- LOAD LESSON ONCE, SHARE VIA OUTLET CONTEXT --------
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

    // -------- SYNC HANDLER (called from modal confirm) --------
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

    return (
        <div className="flex flex-col h-full">
            {/* HEADER ROW: title + sync button */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Lesson #{lessonId}
                </h1>

                <div className="flex flex-col items-end gap-1">
                    {/* Sync status message */}
                    {syncStatus.type && (
                        <div
                            className={`flex items-center gap-1 text-xs ${
                                syncStatus.type === "success"
                                    ? "text-emerald-600"
                                    : "text-rose-600"
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

                    {/* Sync button -> open confirm modal */}
                    <button
                        onClick={() => setShowConfirmSync(true)}
                        disabled={syncing || loading}
                        className="
                            inline-flex items-center gap-1.5
                            px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-slate-900 text-white
                            hover:bg-slate-800
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        <CloudUpload className="w-4 h-4" />
                        Sync to Legacy
                    </button>
                </div>
            </div>

            {/* TABS BAR */}
            <div className="bg-white border-b border-slate-200">
                <div className="flex gap-1">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.path}
                            to={`/admin/lesson/${lessonId}/${t.path}`}
                            className={({ isActive }) =>
                                `
                                    px-4 py-2 text-sm font-medium
                                    rounded-t-md
                                    transition-all
                                    ${
                                    isActive
                                        ? "bg-white border border-slate-300 border-b-white text-blue-600"
                                        : "text-slate-600 hover:bg-slate-100"
                                }
                                `
                            }
                        >
                            {t.label}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* CONTENT AREA (shared lesson context) */}
            <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-md p-4 flex-1">
                <Outlet context={{ lesson, loading } satisfies LessonOutletContext} />
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
