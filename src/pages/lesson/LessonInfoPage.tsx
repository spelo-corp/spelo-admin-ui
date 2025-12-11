// src/pages/lesson/LessonInfoPage.tsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import type { LessonOutletContext } from "../LessonViewPage";
import type { Lesson, LessonLevel } from "../../types";

const LessonInfoPage: React.FC = () => {
    const { lessonDetail, lessonMeta, loading, setLessonMeta } =
        useOutletContext<LessonOutletContext>();

    const baseLesson: Lesson | null = lessonMeta
        ? lessonMeta
        : lessonDetail
            ? {
                id: lessonDetail.lesson_id,
                name: lessonDetail.lesson_name,
                level: lessonDetail.level ?? "A1",
                category_id: lessonDetail.category_id ?? 0,
                description: lessonDetail.description,
                status: lessonDetail.status,
                image: lessonDetail.image,
                gems: lessonDetail.gems,
            }
            : null;

    const [name, setName] = useState("");
    const [level, setLevel] = useState<LessonLevel>("A1");
    const [description, setDescription] = useState("");
    const [gems, setGems] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
        type: null,
        message: "",
    });

    useEffect(() => {
        if (!baseLesson) return;
        setName(baseLesson.name || "");
        setLevel(baseLesson.level || "A1");
        setDescription(baseLesson.description || "");
        setGems(baseLesson.gems ?? 0);
        setStatus({ type: null, message: "" });
    }, [baseLesson]);

    const handleSave = async () => {
        if (!baseLesson || !baseLesson.category_id) {
            setStatus({
                type: "error",
                message: "Lesson metadata is missing; cannot update.",
            });
            return;
        }

        setSaving(true);
        setStatus({ type: null, message: "" });

        try {
            const payload = {
                name: name.trim(),
                level,
                category_id: baseLesson.category_id,
                description: description.trim() || null,
                image: baseLesson.image ?? null,
                gems,
                status: baseLesson.status,
            };

            const res = await api.updateLesson(baseLesson.id, payload);

            if (res.success && res.lesson) {
                setLessonMeta(res.lesson);
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

    if (loading && !baseLesson) {
        return (
            <div className="p-4 bg-white border rounded-xl space-y-3">
                <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
                <div className="h-24 w-full bg-slate-200 rounded animate-pulse" />
            </div>
        );
    }

    if (!baseLesson) {
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
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value as LessonLevel)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="A1">A1 (Beginner)</option>
                        <option value="A2">A2 (Elementary)</option>
                        <option value="B1">B1 (Intermediate)</option>
                        <option value="B2">B2 (Upper Intermediate)</option>
                        <option value="C1">C1 (Advanced)</option>
                        <option value="C2">C2 (Proficient)</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                        Category ID
                    </label>
                    <div className="text-sm text-slate-700 px-3 py-2 border border-slate-100 rounded-lg bg-slate-50">
                        {baseLesson.category_id}
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                    Gems
                </label>
                <input
                    type="number"
                    min={0}
                    value={gems}
                    onChange={(e) => setGems(Number(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
