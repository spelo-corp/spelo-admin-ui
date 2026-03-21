// src/pages/lesson/LessonInfoPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { usePresignedImageUrl } from "../../hooks/usePresignedImageUrl";
import type { Lesson, LessonLevel } from "../../types";
import { validateImageFile } from "../../utils/validateImageFile";
import type { LessonOutletContext } from "../LessonViewPage";

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
    const [image, setImage] = useState("");
    const [updatingImage, setUpdatingImage] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    const [imageExpanded, setImageExpanded] = useState(false);
    const [imageTab, setImageTab] = useState<"url" | "upload">("url");

    useEffect(() => {
        if (!baseLesson) return;
        setName(baseLesson.name || "");
        setLevel(baseLesson.level || "A1");
        setDescription(baseLesson.description || "");
        setGems(baseLesson.gems ?? 0);
        setImage(baseLesson.image ?? "");
        setImageFile(null);
        setStatus({ type: null, message: "" });
    }, [baseLesson]);

    const resolvedImage = usePresignedImageUrl(image.trim() || null);

    const saveLesson = async () => {
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

    const handleSave = async () => saveLesson();

    const handleUpdateImage = async () => {
        if (!baseLesson) return;

        const next = image.trim();
        if (!next) {
            setStatus({ type: "error", message: "Image is required." });
            return;
        }

        setUpdatingImage(true);
        setStatus({ type: null, message: "" });

        try {
            const res = await api.updateLessonImage(baseLesson.id, next);

            if (res.success && res.lesson) {
                setLessonMeta(res.lesson);
                setImage(res.lesson.image ?? next);
                setImageExpanded(false);
                setStatus({ type: "success", message: "Lesson image updated." });
            } else {
                setStatus({ type: "error", message: "Image update failed." });
            }
        } catch (e) {
            console.error(e);
            setStatus({
                type: "error",
                message: "Unexpected error while updating image.",
            });
        } finally {
            setUpdatingImage(false);
        }
    };

    const imageFilePreview = useMemo(() => {
        if (!imageFile) return null;
        return URL.createObjectURL(imageFile);
    }, [imageFile]);

    useEffect(() => {
        if (!imageFilePreview) return;
        return () => URL.revokeObjectURL(imageFilePreview);
    }, [imageFilePreview]);

    const handleUploadImage = async () => {
        if (!baseLesson) return;
        if (!imageFile) {
            setStatus({ type: "error", message: "Choose an image file first." });
            return;
        }

        setUploadingImage(true);
        setStatus({ type: null, message: "" });

        try {
            const res = await api.uploadLessonImage(baseLesson.id, imageFile);
            if (res.success && res.lesson) {
                setLessonMeta(res.lesson);
                setImage(res.lesson.image ?? "");
                setImageFile(null);
                setImageExpanded(false);
                setStatus({ type: "success", message: "Lesson image uploaded." });
            } else {
                setStatus({ type: "error", message: "Image upload failed." });
            }
        } catch (e) {
            console.error(e);
            setStatus({
                type: "error",
                message: "Unexpected error while uploading image.",
            });
        } finally {
            setUploadingImage(false);
        }
    };

    const anyBusy = saving || updatingImage || uploadingImage;

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
        <div className="p-4 bg-white border rounded-xl space-y-3">
            {/* Header row: title + status + save */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                <div className="flex items-center gap-2">
                    {status.type && (
                        <span
                            className={`text-xs ${
                                status.type === "success" ? "text-emerald-600" : "text-rose-600"
                            }`}
                        >
                            {status.message}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={anyBusy}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* 2-column: image left, form right */}
            <div className="flex gap-4 items-start">
                {/* Image column */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                        {imageFilePreview ? (
                            <img src={imageFilePreview} className="w-full h-full object-cover" />
                        ) : resolvedImage ? (
                            <img src={resolvedImage} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] text-slate-400">No image</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setImageExpanded((v) => !v)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        {imageExpanded ? "Hide" : "Change"}
                    </button>
                </div>

                {/* Form column */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Name */}
                    <div className="space-y-0.5">
                        <label className="text-xs font-medium text-slate-600">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Level + Gems + Category in one row */}
                    <div className="grid grid-cols-3 gap-3 items-end">
                        <div className="space-y-0.5">
                            <label className="text-xs font-medium text-slate-600">Level</label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value as LessonLevel)}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                                <option value="C2">C2</option>
                            </select>
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-xs font-medium text-slate-600">Gems</label>
                            <input
                                type="number"
                                min={0}
                                value={gems}
                                onChange={(e) => setGems(Number(e.target.value) || 0)}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-xs font-medium text-slate-600">Category</label>
                            <span className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg">
                                #{baseLesson.category_id}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-0.5">
                        <label className="text-xs font-medium text-slate-600">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Short description of the lesson..."
                        />
                    </div>
                </div>
            </div>

            {/* Expandable image management */}
            {imageExpanded && (
                <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
                    {/* Tab toggle */}
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => setImageTab("url")}
                            className={`px-2.5 py-1 rounded text-xs font-medium ${
                                imageTab === "url"
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            URL
                        </button>
                        <button
                            type="button"
                            onClick={() => setImageTab("upload")}
                            className={`px-2.5 py-1 rounded text-xs font-medium ${
                                imageTab === "upload"
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            Upload
                        </button>
                    </div>

                    {imageTab === "url" ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Paste image URL or path"
                            />
                            <button
                                onClick={handleUpdateImage}
                                disabled={anyBusy}
                                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updatingImage ? "Applying..." : "Apply"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-center">
                            <input
                                type="file"
                                accept="image/*"
                                className="flex-1 min-w-0 text-sm"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    if (file) {
                                        const result = validateImageFile(file);
                                        if (!result.valid) {
                                            setStatus({ type: "error", message: result.error! });
                                            e.target.value = "";
                                            return;
                                        }
                                    }
                                    setImageFile(file);
                                }}
                                disabled={anyBusy}
                            />
                            <button
                                onClick={handleUploadImage}
                                disabled={anyBusy}
                                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploadingImage ? "Uploading..." : "Upload"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LessonInfoPage;
