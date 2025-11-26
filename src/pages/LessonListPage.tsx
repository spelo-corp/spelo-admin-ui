import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Lesson } from "../types";
import LessonCard from "../components/lessons/LessonCard";
import { Btn } from "../components/ui/Btn";
import {Input} from "../components/ui/Input.tsx";
import {Skeleton} from "../components/ui/Skeleton.tsx";

const LessonListPage: React.FC = () => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // form fields
    const [name, setName] = useState("");
    const [level, setLevel] = useState("B1");
    const [categoryId, setCategoryId] = useState(1);
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");

    const loadLessons = async () => {
        setLoading(true);
        try {
            const res = await api.getLessons();
            if (res.success) setLessons(res.lessons);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLessons();
    }, []);

    const handleCreateLesson = async () => {
        if (!name.trim()) return;

        await api.createLesson({
            name,
            level,
            category_id: categoryId,
            description: description || undefined,
            image: image || undefined,
        });

        // reset modal
        setModalOpen(false);
        setName("");
        setDescription("");
        setImage("");

        await loadLessons();
    };

    return (
        <div className="space-y-10">

            {/* PAGE HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold text-slate-900">Lessons Management</h1>

                <Btn.Primary onClick={() => setModalOpen(true)}>
                    ➕ Create Lesson
                </Btn.Primary>
            </div>

            {/* LESSON LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-6">
                {loading ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-card border border-slate-100 p-4 space-y-4 shadow-sm"
                            >
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-5/6" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : lessons.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                        <div className="text-5xl">📚</div>
                        <p className="font-medium text-slate-700">No lessons found yet.</p>
                        <p className="text-sm text-slate-500">
                            Create your first lesson to get started.
                        </p>
                        <Btn.Primary onClick={() => setModalOpen(true)}>
                            ➕ Create Lesson
                        </Btn.Primary>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {lessons.map((lesson) => (
                            <LessonCard
                                key={lesson.id}
                                lesson={lesson}
                                onView={() => (window.location.href = `/admin/lesson/${lesson.id}`)}
                                onAddAudio={() =>
                                    (window.location.href = `/admin/processing-jobs?lesson=${lesson.id}`)
                                }
                                onEdit={() => alert("Edit lesson coming soon")}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-card shadow-shell w-full max-w-md p-6">

                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Create New Lesson</h2>
                            <button onClick={() => setModalOpen(false)}>✕</button>
                        </div>

                        {/* FORM */}
                        <div className="space-y-5 text-sm">

                            {/* NAME */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Lesson Name *
                                </label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </div>

                            {/* LEVEL + CATEGORY */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Level *
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                    >
                                        <option value="A1">A1 (Beginner)</option>
                                        <option value="A2">A2 (Elementary)</option>
                                        <option value="B1">B1 (Intermediate)</option>
                                        <option value="B2">B2 (Upper Intermediate)</option>
                                        <option value="C1">C1 (Advanced)</option>
                                        <option value="C2">C2 (Proficient)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(Number(e.target.value))}
                                    >
                                        <option value={1}>Beginner</option>
                                        <option value={2}>Intermediate</option>
                                        <option value={3}>Advanced</option>
                                        <option value={4}>Business English</option>
                                        <option value={5}>Travel</option>
                                        <option value={6}>Daily Life</option>
                                    </select>
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* IMAGE */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Image URL
                                </label>
                                <Input value={image} onChange={(e) => setImage(e.target.value)} />
                            </div>
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="flex justify-end gap-2 mt-6">
                            <Btn.Secondary onClick={() => setModalOpen(false)}>
                                Cancel
                            </Btn.Secondary>

                            <Btn.Primary onClick={handleCreateLesson}>
                                Create
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonListPage;
