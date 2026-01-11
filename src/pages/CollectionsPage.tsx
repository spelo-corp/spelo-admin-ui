import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CircleAlert,
    Folder,
    Plus,
    Search,
    Sparkles,
    Trash2,
    Edit,
    BookOpen,
    X,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import type { Collection } from "../types/collection";
import {
    useCollections,
    useCreateCollection,
    useDeleteCollection,
    useUpdateCollection,
} from "../hooks/useCollections";

const formatDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
};

const CollectionsPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: collections = [], isLoading, error } = useCollections();
    const createCollectionMutation = useCreateCollection();
    const updateCollectionMutation = useUpdateCollection();
    const deleteCollectionMutation = useDeleteCollection();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [collectionSearch, setCollectionSearch] = useState("");
    const [name, setName] = useState("");

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const resetForm = () => {
        setName("");
        setEditingCollection(null);
        setModalError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (collection: Collection) => {
        setEditingCollection(collection);
        setName(collection.name);
        setModalError(null);
        setModalOpen(true);
    };

    const openDeleteModal = (collection: Collection) => {
        setDeleteTarget(collection);
        setDeleteError(null);
        setDeleteOpen(true);
    };

    const closeDeleteModal = () => {
        if (deleteCollectionMutation.isPending) return;
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteError(null);
    };

    const handleSaveCollection = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setModalError("Collection name is required.");
            return;
        }
        if (trimmed.length > 255) {
            setModalError("Collection name must be 255 characters or less.");
            return;
        }

        setModalError(null);

        try {
            if (editingCollection) {
                await updateCollectionMutation.mutateAsync({
                    id: editingCollection.id,
                    data: { collection_name: trimmed },
                });
            } else {
                await createCollectionMutation.mutateAsync({ collection_name: trimmed });
            }
            setModalOpen(false);
            resetForm();
        } catch (e) {
            setModalError(e instanceof Error ? e.message : "Failed to save collection.");
        }
    };

    const handleDeleteCollection = async () => {
        if (!deleteTarget) return;

        try {
            await deleteCollectionMutation.mutateAsync(deleteTarget.id);
            setDeleteOpen(false);
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : "Failed to delete collection.");
        }
    };

    const filteredCollections = useMemo(() => {
        const term = collectionSearch.trim().toLowerCase();
        if (!term) return collections;
        return collections.filter((collection) =>
            collection.name.toLowerCase().includes(term)
        );
    }, [collections, collectionSearch]);

    const saving = createCollectionMutation.isPending || updateCollectionMutation.isPending;
    const deleting = deleteCollectionMutation.isPending;

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader
                badge={
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        <Sparkles className="w-3.5 h-3.5" />
                        Word Collections
                    </div>
                }
                title="Collections"
                titleAddon={
                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                        {collections.length} total
                    </span>
                }
                description="Create collections of terminology that are shared with all users."
                actions={
                    <Btn.HeroPrimary onClick={openCreateModal}>
                        <Plus className="w-4 h-4" />
                        New Collection
                    </Btn.HeroPrimary>
                }
            />

            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={collectionSearch}
                                onChange={(e) => setCollectionSearch(e.target.value)}
                                placeholder="Search collections by name"
                                className="rounded-xl pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                            <Folder className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Collections</p>
                            <p className="text-sm text-slate-600">{filteredCollections.length} showing</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {error ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error instanceof Error ? error.message : "Failed to load collections."}
                        </div>
                    ) : null}

                    {isLoading ? (
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
                    ) : collections.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                <Folder className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-slate-700">No collections found yet.</p>
                            <p className="text-sm text-slate-500">
                                Create your first collection to share with all users.
                            </p>
                            <div className="flex justify-center pt-1">
                                <Btn.Primary onClick={openCreateModal} className="px-5">
                                    <Plus className="w-4 h-4" />
                                    Create Collection
                                </Btn.Primary>
                            </div>
                        </div>
                    ) : filteredCollections.length === 0 ? (
                        <div className="text-center py-10 space-y-2 text-sm text-slate-500">
                            <p className="text-lg text-slate-700 font-semibold">No collections match your search.</p>
                            <p>Try a different search term.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCollections.map((collection) => {
                                const updatedLabel = formatDate(collection.updated_at ?? collection.created_at);
                                return (
                                    <div
                                        key={collection.id}
                                        className="bg-white rounded-card border border-slate-100 p-5 shadow-sm hover:shadow-md transition space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                    Collection
                                                </p>
                                                <h3 className="font-semibold text-slate-800">
                                                    {collection.name}
                                                </h3>
                                            </div>
                                            <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                                                <Folder className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-slate-600">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">ID</span>
                                                <span className="font-medium">#{collection.id}</span>
                                            </div>
                                            {typeof collection.total_words === "number" ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">Words</span>
                                                    <span className="font-medium">{collection.total_words}</span>
                                                </div>
                                            ) : null}
                                            {updatedLabel ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">Updated</span>
                                                    <span className="font-medium">{updatedLabel}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <button
                                                onClick={() => navigate(`/admin/collections/${collection.id}`)}
                                                className="flex-1 px-3 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition inline-flex items-center justify-center gap-2"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                Manage words
                                            </button>
                                            <button
                                                onClick={() => openEditModal(collection)}
                                                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(collection)}
                                                className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-2xl shadow-shell w-full max-w-lg p-6 border border-slate-100 animate-slideIn">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Collection
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {editingCollection ? "Edit Collection" : "Create New Collection"}
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

                        <div className="space-y-5 text-sm">
                            {modalError && (
                                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                                    {modalError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Collection Name *
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={255}
                                />
                            </div>
                        </div>

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

                            <Btn.Primary onClick={handleSaveCollection} disabled={saving}>
                                {saving ? "Saving..." : editingCollection ? "Save Changes" : "Create"}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}

            {deleteOpen && deleteTarget ? (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-card shadow-shell w-full max-w-md border border-slate-100 overflow-hidden">
                        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-600 to-amber-500 text-white px-6 py-5">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
                            <div className="relative flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">
                                        Delete collection
                                    </p>
                                    <h2 className="mt-2 text-xl font-semibold truncate">
                                        {deleteTarget.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-white/80">
                                        This will remove the collection for all users.
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
                                            This action cannot be undone.
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
                                    onClick={handleDeleteCollection}
                                    disabled={deleting}
                                    className="bg-rose-600 hover:bg-rose-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleting ? "Deleting…" : "Delete collection"}
                                </Btn.Primary>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

        </div>
    );
};

export default CollectionsPage;
