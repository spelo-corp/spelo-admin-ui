import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../hooks/useCategories";
import type { Category } from "../types/category";
import { Btn } from "../components/ui/Btn";
import PageHeader from "../components/common/PageHeader";
import { Input } from "../components/ui/Input.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";
import {
    Layers,
    CircleAlert,
    Plus,
    Search,
    Sparkles,
    Trash2,
    X,
    Edit,
    BookOpen,
} from "lucide-react";

const CategoryManagementPage: React.FC = () => {
    const navigate = useNavigate();

    // Use React Query for categories
    const { data: categories = [], isLoading: loading } = useCategories();
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [parentId, setParentId] = useState(0);
    const [status, setStatus] = useState(1);

    // delete confirm modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const resetForm = () => {
        setName("");
        setDescription("");
        setImage("");
        setParentId(0);
        setStatus(1);
        setEditingCategory(null);
        setModalError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setDescription(category.description ?? "");
        setImage(category.image ?? "");
        setParentId(category.parent_id ?? 0);
        setStatus(category.status ?? 1);
        setModalError(null);
        setModalOpen(true);
    };

    const openDeleteModal = (category: Category) => {
        setDeleteTarget(category);
        setDeleteError(null);
        setDeleteOpen(true);
    };

    const closeDeleteModal = () => {
        if (deleteCategoryMutation.isPending) return;
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteError(null);
    };

    const handleDeleteCategory = async () => {
        if (!deleteTarget) return;

        try {
            await deleteCategoryMutation.mutateAsync(deleteTarget.id);
            setDeleteOpen(false);
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : "Failed to delete category.");
        }
    };

    const handleSaveCategory = async () => {
        if (!name.trim()) {
            setModalError("Category name is required.");
            return;
        }

        setModalError(null);

        const trimmedName = name.trim();
        const payload = {
            name: trimmedName,
            description: description || undefined,
            image: image || undefined,
            parent_id: parentId,
            status,
        };

        try {
            if (editingCategory) {
                await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data: payload });
            } else {
                await createCategoryMutation.mutateAsync(payload);
            }

            setModalOpen(false);
            resetForm();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save category.";
            setModalError(message);
        }
    };

    const filteredCategories = useMemo(() => {
        const term = search.trim().toLowerCase();
        return categories.filter((category) => {
            const matchesSearch =
                !term ||
                category.name.toLowerCase().includes(term) ||
                category.description?.toLowerCase().includes(term);
            return matchesSearch;
        });
    }, [categories, search]);

    const activeCount = useMemo(
        () => categories.filter((c) => c.status === 1).length,
        [categories]
    );
    const inactiveCount = categories.length - activeCount;

    const saving = createCategoryMutation.isPending || updateCategoryMutation.isPending;
    const deleting = deleteCategoryMutation.isPending;

    return (
        <div className="space-y-8 px-8 py-6">

            {/* HERO */}
            <PageHeader
                badge={
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        Category Library
                    </div>
                }
                title="Category Management"
                titleAddon={
                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                        {categories.length} total
                    </span>
                }
                description="Create, edit, and organize categories. Categories help organize lessons by topic."
                actions={
                    <Btn.HeroPrimary onClick={openCreateModal}>
                        <Plus className="w-4 h-4" />
                        New Category
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 border border-emerald-200">
                            Fast Create
                        </span>
                    </Btn.HeroPrimary>
                }
            >
                <div className="flex gap-3 text-xs text-white/80">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                        <Layers className="w-4 h-4" /> Active: {activeCount}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                        <Layers className="w-4 h-4" /> Inactive: {inactiveCount}
                    </span>
                </div>
            </PageHeader>

            {/* FILTERS */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by category name or description"
                                className="rounded-xl pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* CATEGORY LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Categories</p>
                            <p className="text-sm text-slate-600">{filteredCategories.length} showing</p>
                        </div>
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
                    ) : categories.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                <Layers className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-slate-700">No categories found yet.</p>
                            <p className="text-sm text-slate-500">
                                Create your first category to get started.
                            </p>
                            <div className="flex justify-center pt-1">
                                <Btn.Primary onClick={openCreateModal} className="px-5">
                                    <Plus className="w-4 h-4" />
                                    Create Category
                                </Btn.Primary>
                            </div>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-10 space-y-2 text-sm text-slate-500">
                            <p className="text-lg text-slate-700 font-semibold">No categories match your search.</p>
                            <p>Try a different search term.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="bg-white rounded-card border border-slate-100 p-5 shadow-sm hover:shadow-md transition space-y-4"
                                >
                                    {/* Image */}
                                    {category.image && (
                                        <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100">
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-1">{category.name}</h3>
                                        {category.description && (
                                            <p className="text-sm text-slate-500 line-clamp-2">
                                                {category.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-xs text-slate-600">
                                        <span className="inline-flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {category.lesson_count ?? 0} lessons
                                        </span>
                                        {category.min_level && category.max_level && (
                                            <span>
                                                {category.min_level} - {category.max_level}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => navigate(`/admin/lessons?category=${category.id}`)}
                                            className="flex-1 px-3 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition"
                                        >
                                            View Lessons
                                        </button>
                                        <button
                                            onClick={() => openEditModal(category)}
                                            className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(category)}
                                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
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
                                        Category
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {editingCategory ? "Edit Category" : "Create New Category"}
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
                                    Category Name *
                                </label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
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

                            {/* PARENT ID & STATUS */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Parent ID
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={parentId}
                                        onChange={(e) => setParentId(Number(e.target.value) || 0)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={status}
                                        onChange={(e) => setStatus(Number(e.target.value))}
                                    >
                                        <option value={1}>Active</option>
                                        <option value={0}>Inactive</option>
                                    </select>
                                </div>
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

                            <Btn.Primary onClick={handleSaveCategory} disabled={saving}>
                                {saving ? "Saving..." : editingCategory ? "Save Changes" : "Create"}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {deleteOpen && deleteTarget ? (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-card shadow-shell w-full max-w-md border border-slate-100 overflow-hidden">
                        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-600 to-amber-500 text-white px-6 py-5">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
                            <div className="relative flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">
                                        Delete category
                                    </p>
                                    <h2 className="mt-2 text-xl font-semibold truncate">
                                        {deleteTarget.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-white/80">
                                        This will soft-delete the category (set <span className="font-semibold">status = 0</span>).
                                    </p>
                                </div>
                                <button
                                    onClick={closeDeleteModal}
                                    disabled={deleting}
                                    className="rounded-full p-2 text-white/80 transition hover:bg-white/15 disabled:opacity-60"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <div className="flex items-start gap-2">
                                    <CircleAlert className="w-5 h-5 mt-0.5" />
                                    <div>
                                        <div className="font-semibold">Are you sure?</div>
                                        <div className="text-amber-800/80">
                                            This category has {deleteTarget.lesson_count ?? 0} lessons associated with it.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {deleteError ? (
                                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {deleteError}
                                </div>
                            ) : null}

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                                <Btn.Secondary onClick={closeDeleteModal} disabled={deleting}>
                                    Cancel
                                </Btn.Secondary>
                                <Btn.Primary
                                    onClick={handleDeleteCategory}
                                    disabled={deleting}
                                    className="bg-rose-600 hover:bg-rose-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleting ? "Deleting…" : "Delete category"}
                                </Btn.Primary>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default CategoryManagementPage;
