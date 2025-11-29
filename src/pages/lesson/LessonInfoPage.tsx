// src/pages/lesson/LessonInfoPage.tsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import type { LessonOutletContext } from "../LessonViewPage";

const LessonInfoPage: React.FC = () => {
    const { lesson, loading, setLesson } = useOutletContext<LessonOutletContext>();

    const [name, setName] = useState("");
    const [level, setLevel] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
        type: null,
        message: "",
    });

    useEffect(() => {
        if (!lesson) return;
        setName(lesson.name || "");
        setLevel(lesson.level || "");
        setDescription(lesson.description || "");
        setStatus({ type: null, message: "" });
    }, [lesson]);

    const handleSave = async () => {
        if (!lesson) return;

        setSaving(true);
        setStatus({ type: null, message: "" });

        try {
            const payload = {
                name: name.trim(),
                level: level.trim(),
                category_id: lesson.category_id,
                description: description.trim() || null,
                image: lesson.image ?? null,
            };

            const res = await api.updateLesson(lesson.id, payload);

            if (res.success) {
                // update shared lesson state so other tabs see it
                setLesson(res.lesson);
                setStatus({ type: "success", message: "Lesson info updated." });
            } else {
                setStatus({ type: "error", message: "Update failed." });
            }
        } catch (e) {
            console.error(e);
            setStatus({
                type: "error",
                message: "Unexpected error while updating lesson.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !lesson) {
        return (
            <div className="p-4 bg-white border rounded-xl space-y-3">
                <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
                <div className="h-24 w-full bg-slate-200 rounded animate-pulse" />
            </div>
        );
    }

    if (!lesson) {
        return <div className="p-4 text-rose-600 text-sm">Lesson not found.</div>;
    }

    return (
        <div className="p-4 bg-white border rounded-xl space-y-4">
            {/* Header row: title + save */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                    Basic Information
                </h2>

                <div className="flex items-center gap-2">
                    {status.type && (
                        <span
                            className={`text-xs ${
                                status.type === "success"
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                            }`}
                        >
                            {status.message}
                        </span>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="
                            px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-blue-600 text-white
                            hover:bg-blue-700
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                    Lesson Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {/* Level & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                        Level
                    </label>
                    <input
                        type="text"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        placeholder="A2 / B1 / etc."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                        Category ID
                    </label>
                    <div className="text-sm text-slate-700 px-3 py-2 border border-slate-100 rounded-lg bg-slate-50">
                        {lesson.category_id}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Short description of the lesson..."
                />
            </div>
        </div>
    );
};

export default LessonInfoPage;
