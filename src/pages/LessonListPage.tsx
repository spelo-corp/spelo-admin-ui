import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Lesson, LessonLevel } from "../types";
import LessonCard from "../components/lessons/LessonCard";
import { CreateJobModal } from "../components/jobs/CreateJobModal";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";
import {
    BookOpen,
    Filter,
    Layers,
    Plus,
    Search,
    Sparkles,
    X,
} from "lucide-react";

const CATEGORY_OPTIONS = [
    { id: 1, label: "Beginner" },
    { id: 2, label: "Intermediate" },
    { id: 3, label: "Advanced" },
    { id: 4, label: "Business English" },
    { id: 5, label: "Travel" },
    { id: 6, label: "Daily Life" },
];

const LessonListPage: React.FC = () => {
    const navigate = useNavigate();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState<LessonLevel | "ALL">("ALL");
    const [categoryFilter, setCategoryFilter] = useState<number>(CATEGORY_OPTIONS[0].id);

    // form fields
    const [name, setName] = useState("");
    const [level, setLevel] = useState<LessonLevel>("A1");
    const [categoryId, setCategoryId] = useState(CATEGORY_OPTIONS[0].id);
    const [gems, setGems] = useState<number>(0);
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");

    // add audio modal
    const [jobModalOpen, setJobModalOpen] = useState(false);
    const [jobModalLessonId, setJobModalLessonId] = useState<number | null>(null);

    const loadLessons = async () => {
        setLoading(true);
        try {
            const res = await api.getLessons({
                categoryId: categoryFilter,
                level: levelFilter === "ALL" ? undefined : levelFilter,
            });
            if (res.success) setLessons(res.lessons);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadLessons();
    }, [categoryFilter, levelFilter]);

    const resetForm = () => {
        setName("");
        setLevel("A1");
        setCategoryId(categoryFilter);
        setGems(0);
        setDescription("");
        setImage("");
        setEditingLesson(null);
        setModalError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (lesson: Lesson) => {
        setEditingLesson(lesson);
        setName(lesson.name);
        setLevel(lesson.level);
        setCategoryId(lesson.category_id);
        setGems(lesson.gems ?? 0);
        setDescription(lesson.description ?? "");
        setImage(lesson.image ?? "");
        setModalError(null);
        setModalOpen(true);
    };

    const handleSaveLesson = async () => {
        if (!name.trim()) {
            setModalError("Lesson name is required.");
            return;
        }

        setSaving(true);
        setModalError(null);

        const trimmedName = name.trim();
        const payload = {
            name: trimmedName,
            level,
            category_id: categoryId,
            gems,
            description: description || undefined,
            image: image || undefined,
            status: editingLesson?.status ?? undefined,
        };

        try {
            if (editingLesson) {
                await api.updateLesson(editingLesson.id, payload);
            } else {
                await api.createLesson(payload);
            }

            setModalOpen(false);
            resetForm();
            await loadLessons();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save lesson.";
            setModalError(message);
        } finally {
            setSaving(false);
        }
    };

    const levels: Array<LessonLevel | "ALL"> = useMemo(() => {
        const unique = new Set(lessons.map((l) => l.level));
        return ["ALL", ...Array.from(unique)];
    }, [lessons]);

    const filteredLessons = useMemo(() => {
        const term = search.trim().toLowerCase();
        return lessons.filter((lesson) => {
            const matchesSearch =
                !term ||
                lesson.name.toLowerCase().includes(term) ||
                lesson.description?.toLowerCase().includes(term);
            const matchesLevel = levelFilter === "ALL" || lesson.level === levelFilter;
            return matchesSearch && matchesLevel;
        });
    }, [lessons, search, levelFilter]);

    const activeCount = useMemo(
        () => lessons.filter((l) => l.status === 1).length,
        [lessons]
    );
    const inactiveCount = lessons.length - activeCount;

    return (
        <div className="space-y-8">

            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand via-brand-dark to-emerald-700 text-white p-6 shadow-shell">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-20 -right-10 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
                    <div className="absolute -bottom-16 left-12 w-44 h-44 bg-emerald-400/10 blur-3xl rounded-full" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_45%)]" />
                </div>

                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            Lesson Library
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-semibold drop-shadow-sm">Lessons Management</h1>
                            <span className="text-xs px-3 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
                                {lessons.length} total
                            </span>
                        </div>
                        <p className="text-sm text-white/85 max-w-2xl">
                            Create, edit, and organize lessons. Use filters to quickly find the lessons you need.
                        </p>
                        <div className="flex gap-3 text-xs text-white/80">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                                <BookOpen className="w-4 h-4" /> Active: {activeCount}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                                <Layers className="w-4 h-4" /> Inactive: {inactiveCount}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="group relative inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-slate-50"
                        >
                            <span className="absolute inset-0 rounded-full border border-white/60 opacity-70 group-hover:opacity-100 transition" />
                            <Plus className="w-4 h-4" />
                            New Lesson
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 border border-emerald-200">
                                Fast Create
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by lesson name or description"
                                className="rounded-xl pl-9"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium bg-white"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(Number(e.target.value))}
                        >
                            {CATEGORY_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {levels.map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => setLevelFilter(lvl)}
                                className={`
                                    px-3 py-1.5 rounded-full text-xs font-medium border transition
                                    ${levelFilter === lvl
                                    ? "bg-brand text-white border-brand shadow-sm"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}
                                `}
                            >
                                {lvl === "ALL" ? "All levels" : lvl}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* LESSON LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lessons</p>
                            <p className="text-sm text-slate-600">{filteredLessons.length} showing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
                            <Filter className="w-4 h-4" /> Level: {levelFilter === "ALL" ? "All" : levelFilter}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 border border-slate-200">
                            <Search className="w-4 h-4" /> {search ? `“${search}”` : "No search"}
                        </span>
                    </div>
                </div>

                <div className="p-6">
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
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-slate-700">No lessons found yet.</p>
                            <p className="text-sm text-slate-500">
                                Create your first lesson to get started.
                            </p>
                            <div className="flex justify-center pt-1">
                                <Btn.Primary onClick={openCreateModal} className="px-5">
                                    <Plus className="w-4 h-4" />
                                    Create Lesson
                                </Btn.Primary>
                            </div>
                        </div>
                    ) : filteredLessons.length === 0 ? (
                        <div className="text-center py-10 space-y-2 text-sm text-slate-500">
                            <p className="text-lg text-slate-700 font-semibold">No lessons match your filters.</p>
                            <p>Try clearing the search or choosing another level.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredLessons.map((lesson) => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onView={() =>
                                        navigate(`/admin/lessons/${lesson.id}`, { state: { lesson } })
                                    }
                                    onAddAudio={() =>
                                        {
                                            setJobModalLessonId(lesson.id);
                                            setJobModalOpen(true);
                                        }
                                    }
                                    onEdit={() => openEditModal(lesson)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-2xl shadow-shell w-full max-w-lg p-6 border border-slate-100 animate-slideIn">

                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Lesson
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                {editingLesson ? "Edit Lesson" : "Create New Lesson"}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    resetForm();
                                }}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* FORM */}
                        <div className="space-y-5 text-sm">
                            {modalError && (
                                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                                    {modalError}
                                </div>
                            )}

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
                                        onChange={(e) => setLevel(e.target.value as LessonLevel)}
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
                                        {CATEGORY_OPTIONS.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Gems
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={gems}
                                    onChange={(e) => setGems(Number(e.target.value) || 0)}
                                />
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
                            <Btn.Secondary
                                onClick={() => {
                                    setModalOpen(false);
                                    resetForm();
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </Btn.Secondary>

                            <Btn.Primary onClick={handleSaveLesson} disabled={saving}>
                                {saving ? "Saving..." : editingLesson ? "Save Changes" : "Create"}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}

            <CreateJobModal
                open={jobModalOpen}
                onClose={() => {
                    setJobModalOpen(false);
                    setJobModalLessonId(null);
                }}
                onCreated={() => {
                    setJobModalOpen(false);
                    setJobModalLessonId(null);
                }}
                lessons={lessons}
                defaultLessonId={jobModalLessonId}
            />
        </div>
    );
};

export default LessonListPage;
