import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CircleAlert,
    Folder,
    ImagePlus,
    Loader2,
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
    useLibraryCollections,
    useCreateCollection,
    useDeleteCollection,
    useUpdateCollection,
    useGenerateCollection,
} from "../hooks/useCollections";
import { processImage } from "../utils/imageProcessing";
import { filesApi } from "../api/files";
import { collectionsApi } from "../api/collections";

const formatDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
};

const CollectionsPage: React.FC = () => {
    const navigate = useNavigate();
    // Default to managing library collections
    const { data: collections = [], isLoading, error } = useLibraryCollections(0, 100);
    const createCollectionMutation = useCreateCollection();
    const updateCollectionMutation = useUpdateCollection();
    const deleteCollectionMutation = useDeleteCollection();
    const generateCollectionMutation = useGenerateCollection();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [collectionSearch, setCollectionSearch] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePadding, setImagePadding] = useState(32);
    const [targetSize, setTargetSize] = useState(512);
    const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [price, setPrice] = useState<string>(""); // input as string to handle empty
    const [type, setType] = useState<"LIBRARY" | "USER">("LIBRARY");

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Generate modal state
    const [generateOpen, setGenerateOpen] = useState(false);
    const [generateTarget, setGenerateTarget] = useState<Collection | null>(null);
    const [generateName, setGenerateName] = useState("");
    const [generateHint, setGenerateHint] = useState("");
    const [generateWordCount, setGenerateWordCount] = useState("20");
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

    const [generatePhrasalVerbs, setGeneratePhrasalVerbs] = useState(false);
    const [generatePhrasalVerbsPct, setGeneratePhrasalVerbsPct] = useState(20);
    const [generateIdioms, setGenerateIdioms] = useState(false);
    const [generateIdiomsPct, setGenerateIdiomsPct] = useState(10);

    const resetForm = () => {
        setName("");
        setDescription("");
        setImage("");
        setImagePreviewUrl(null);
        setImageFile(null);
        setProcessedPreviewUrl(null);
        setImagePadding(32);
        setTargetSize(512);
        setImageUploading(false);
        setPrice("");
        setType("LIBRARY");
        setEditingCollection(null);
        setModalError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openGenerateModal = (collection?: Collection) => {
        setGenerateTarget(collection ?? null);
        setGenerateName(collection ? "" : "");
        setGenerateHint("");
        setGenerateWordCount("20");
        setGenerateError(null);
        setGenerateSuccess(null);
        setGeneratePhrasalVerbs(false);
        setGeneratePhrasalVerbsPct(20);
        setGenerateIdioms(false);
        setGenerateIdiomsPct(10);
        setGenerateOpen(true);
    };

    const handleGenerate = async () => {
        setGenerateError(null);
        setGenerateSuccess(null);

        const wordCount = Math.max(1, Math.min(200, Number(generateWordCount) || 20));

        if (!generateTarget && !generateName.trim()) {
            setGenerateError("Collection name is required for a new collection.");
            return;
        }

        try {
            const payload: Record<string, unknown> = {
                prompt_hint: generateHint.trim() || undefined,
                word_count: wordCount,
            };

            const pvPct = generatePhrasalVerbs ? generatePhrasalVerbsPct : 0;
            const idiomPct = generateIdioms ? generateIdiomsPct : 0;
            const wordPct = 100 - pvPct - idiomPct;

            if (pvPct > 0 || idiomPct > 0) {
                payload.word_type_distribution = {
                    word: wordPct,
                    phrasal_verb: pvPct,
                    idiom: idiomPct
                };
            }

            if (generateTarget) {
                payload.collection_id = generateTarget.id;
            } else {
                payload.collection_name = generateName.trim();
            }

            const res = await generateCollectionMutation.mutateAsync(payload as any);
            const jobId = (res as any)?.job_id ?? (res as any)?.jobId;
            setGenerateSuccess(
                `Generation started! Job ID: ${jobId ?? "N/A"}. Words will appear once processing completes.`
            );
        } catch (e) {
            setGenerateError(e instanceof Error ? e.message : "Failed to start generation.");
        }
    };

    const openEditModal = (collection: Collection) => {
        setEditingCollection(collection);
        setName(collection.name);
        setDescription(collection.description || "");
        setImage(collection.image || "");
        setImageFile(null);
        setImagePreviewUrl(null);
        setProcessedPreviewUrl(null);
        setImagePadding(32);
        setTargetSize(512);
        setPrice(collection.price !== undefined ? String(collection.price) : "");
        setType(collection.type === "USER" ? "USER" : "LIBRARY");
        setModalError(null);
        setModalOpen(true);

        // Resolve existing image key to presigned URL for preview
        if (collection.image) {
            filesApi.getPresignedUrl(collection.image, "spelo-images").then((res) => {
                if (res.success && res.url) setImagePreviewUrl(res.url);
            }).catch(() => { });
        }
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

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        // Clear remote preview if user picks a local file
        setImagePreviewUrl(null);
    };

    // Effect to generate processed preview
    useEffect(() => {
        let active = true;

        const generatePreview = async () => {
            if (!imageFile) {
                if (active) setProcessedPreviewUrl(null);
                return;
            }

            try {
                const processed = await processImage(imageFile, {
                    targetSize: { width: targetSize, height: targetSize },
                    padding: imagePadding,
                    backgroundColor: "transparent",
                });

                const url = URL.createObjectURL(processed);

                if (active) {
                    setProcessedPreviewUrl(url);
                } else {
                    URL.revokeObjectURL(url);
                }
            } catch (e) {
                console.error("Failed to process image preview", e);
            }
        };

        generatePreview();

        return () => {
            active = false;
        };
    }, [imageFile, imagePadding, targetSize]);

    // Clean up object URLs
    useEffect(() => {
        return () => {
            if (processedPreviewUrl) URL.revokeObjectURL(processedPreviewUrl);
        };
    }, [processedPreviewUrl]);

    const handleSaveCollection = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setModalError("Collection name is required.");
            return;
        }
        if (trimmedName.length > 255) {
            setModalError("Collection name must be 255 characters or less.");
            return;
        }

        const parsedPrice = price.trim() === "" ? undefined : Number(price);
        if (parsedPrice !== undefined && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
            setModalError("Price must be a valid non-negative number (or leave empty for free).");
            return;
        }

        setModalError(null);

        // Determine initial image key from text input (existing or manually entered)
        let imageKey = image.trim() || undefined;

        // If editing and a new file is pending, upload it first to get the key
        if (imageFile && editingCollection) {
            try {
                setImageUploading(true);
                await collectionsApi.uploadCollectionImage(editingCollection.id, imageFile, {
                    targetSize: { width: targetSize, height: targetSize },
                    padding: imagePadding,
                    backgroundColor: "transparent",
                });

                imageKey = undefined;
            } catch (e) {
                setModalError(e instanceof Error ? e.message : "Failed to upload image.");
                setImageUploading(false);
                return;
            } finally {
                setImageUploading(false);
            }
        }

        const payload = {
            collection_name: trimmedName,
            description: description.trim() || undefined,
            image: imageKey,
            type: type,
            price: parsedPrice,
        };

        try {
            if (editingCollection) {
                await updateCollectionMutation.mutateAsync({
                    id: editingCollection.id,
                    data: payload,
                });
            } else {
                // Create flow
                const result = await createCollectionMutation.mutateAsync(payload);
                if (imageFile && result?.data?.id) {
                    try {
                        const newCollectionId = result.data.id;
                        await collectionsApi.uploadCollectionImage(newCollectionId, imageFile, {
                            targetSize: { width: targetSize, height: targetSize },
                            padding: imagePadding,
                            backgroundColor: "transparent",
                        });
                    } catch {
                        // ignore secondary update errors, main creation succeeded
                    }
                }
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

    const saving = createCollectionMutation.isPending || updateCollectionMutation.isPending || imageUploading;
    const deleting = deleteCollectionMutation.isPending;
    const generating = generateCollectionMutation.isPending;

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader
                badge={
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        <Sparkles className="w-3.5 h-3.5" />
                        Library Collections
                    </div>
                }
                title="Library Collections"
                titleAddon={
                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                        {collections.length} total
                    </span>
                }
                description="Manage public collections available in the library."
                actions={
                    <div className="flex items-center gap-2">
                        <Btn.HeroPrimary onClick={() => openGenerateModal()}>
                            <Sparkles className="w-4 h-4" />
                            AI Generate
                        </Btn.HeroPrimary>
                        <Btn.HeroPrimary onClick={openCreateModal}>
                            <Plus className="w-4 h-4" />
                            New Collection
                        </Btn.HeroPrimary>
                    </div>
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
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Library</p>
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
                            <p className="font-medium text-slate-700">No library collections found.</p>
                            <p className="text-sm text-slate-500">
                                Create a collection to make it available in the library.
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
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                                                        {collection.type}
                                                    </span>
                                                    {collection.price && collection.price > 0 ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                                                            {collection.price} gems
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                                                            Free
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-slate-800 line-clamp-1" title={collection.name}>
                                                    {collection.name}
                                                </h3>
                                            </div>
                                            <CollectionThumbnail imageKey={collection.image} bgColor={collection.bg_color} />
                                        </div>

                                        <p className="text-sm text-slate-500 line-clamp-2 h-10">
                                            {collection.description || "No description provided."}
                                        </p>

                                        <div className="space-y-1 text-xs text-slate-500">
                                            <div className="flex items-center justify-between">
                                                <span>Words</span>
                                                <span className="font-medium text-slate-700">{collection.total_words ?? 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Updated</span>
                                                <span className="font-medium text-slate-700">{updatedLabel || "N/A"}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <button
                                                onClick={() => navigate(`/admin/collections/${collection.id}`)}
                                                className="flex-1 px-3 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition inline-flex items-center justify-center gap-2"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                                Manage
                                            </button>
                                            <button
                                                onClick={() => openEditModal(collection)}
                                                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openGenerateModal(collection)}
                                                title="Enrich with AI"
                                                className="px-3 py-2 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 transition"
                                            >
                                                <Sparkles className="w-4 h-4" />
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
                                        {editingCollection ? "Edit" : "Create"}
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {editingCollection ? "Edit Collection" : "New Library Collection"}
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

                        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
                            {modalError && (
                                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                                    {modalError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Name *
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={255}
                                    placeholder="e.g. Business English"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none min-h-[80px]"
                                    placeholder="What is this collection about?"
                                    maxLength={5000}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Image
                                </label>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageFileChange}
                                />
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        {processedPreviewUrl ? (
                                            <div className="space-y-1">
                                                <img
                                                    src={processedPreviewUrl}
                                                    alt="Processed Preview"
                                                    className="w-24 h-24 rounded-xl object-contain border border-slate-200 bg-slate-50"
                                                />
                                                <p className="text-[10px] text-center text-slate-400">Preview</p>
                                            </div>
                                        ) : imagePreviewUrl ? (
                                            <img
                                                src={imagePreviewUrl}
                                                alt="Current"
                                                className="w-24 h-24 rounded-xl object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                <ImagePlus className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => imageInputRef.current?.click()}
                                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
                                            >
                                                {imageFile || imagePreviewUrl ? "Change image" : "Upload image"}
                                            </button>
                                            {(imageFile || imagePreviewUrl) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImage("");
                                                        setImageFile(null);
                                                        setImagePreviewUrl(null);
                                                        setProcessedPreviewUrl(null);
                                                        if (imageInputRef.current) imageInputRef.current.value = "";
                                                    }}
                                                    className="px-2 py-1.5 rounded-lg text-sm text-rose-500 hover:bg-rose-50 transition"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        {imageFile && (
                                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                                        Padding (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={imagePadding}
                                                        onChange={(e) => setImagePadding(Number(e.target.value))}
                                                        className="w-full text-xs px-2 py-1 rounded border border-slate-200"
                                                        min={0}
                                                        max={200}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                                        Size (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={targetSize}
                                                        onChange={(e) => setTargetSize(Number(e.target.value))}
                                                        className="w-full text-xs px-2 py-1 rounded border border-slate-200"
                                                        min={64}
                                                        max={1024}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as "LIBRARY" | "USER")}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-white"
                                    >
                                        <option value="LIBRARY">Library (Public)</option>
                                        <option value="USER">User (Private)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Price (Gems)
                                    </label>
                                    <Input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0 for free"
                                        min={0}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Leave empty or 0 for free.</p>
                                </div>
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
                                {saving ? "Saving..." : "Save Collection"}
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

            {generateOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-2xl shadow-shell w-full max-w-lg p-6 border border-slate-100 animate-slideIn">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        {generateTarget ? "Enrich" : "Generate"}
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {generateTarget
                                            ? `Enrich "${generateTarget.name}"`
                                            : "AI Generate Collection"}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setGenerateOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            {generateError && (
                                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                                    {generateError}
                                </div>
                            )}
                            {generateSuccess && (
                                <div className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">
                                    {generateSuccess}
                                </div>
                            )}

                            {!generateTarget && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Collection Name *
                                    </label>
                                    <Input
                                        value={generateName}
                                        onChange={(e) => setGenerateName(e.target.value)}
                                        maxLength={255}
                                        placeholder="e.g. Medical English"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Prompt Hint
                                </label>
                                <textarea
                                    value={generateHint}
                                    onChange={(e) => setGenerateHint(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none min-h-[80px]"
                                    placeholder="e.g. Focus on advanced medical terminology used in hospitals"
                                    maxLength={2000}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Optional hint to guide the AI. Leave empty to use the collection name as the topic.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Total Word Count
                                </label>
                                <Input
                                    type="number"
                                    value={generateWordCount}
                                    onChange={(e) => setGenerateWordCount(e.target.value)}
                                    min={1}
                                    max={200}
                                    placeholder="20"
                                />
                            </div>

                            {/* Word Types Configuration */}
                            <div className="pt-2 border-t border-slate-100 mt-4">
                                <label className="block text-xs font-medium text-slate-600 mb-3">
                                    Word Types Distribution
                                </label>

                                <div className="space-y-4">
                                    {/* Phrasal Verbs Toggle */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-700">Include Phrasal Verbs</span>
                                            <button
                                                type="button"
                                                onClick={() => setGeneratePhrasalVerbs(!generatePhrasalVerbs)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${generatePhrasalVerbs ? 'bg-violet-600' : 'bg-slate-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${generatePhrasalVerbs ? 'translate-x-4' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        {generatePhrasalVerbs && (
                                            <div className="mt-2 flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="40"
                                                    step="5"
                                                    value={generatePhrasalVerbsPct}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        const currentIdiom = generateIdioms ? generateIdiomsPct : 0;
                                                        if (val + currentIdiom <= 50) {
                                                            setGeneratePhrasalVerbsPct(val);
                                                        }
                                                    }}
                                                    className="flex-1 accent-violet-600 h-1.5 rounded-full bg-slate-200 appearance-none outline-none"
                                                />
                                                <span className="text-xs font-medium text-slate-500 w-10 text-right">{generatePhrasalVerbsPct}%</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Idioms Toggle */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-700">Include Idioms</span>
                                            <button
                                                type="button"
                                                onClick={() => setGenerateIdioms(!generateIdioms)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${generateIdioms ? 'bg-violet-600' : 'bg-slate-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${generateIdioms ? 'translate-x-4' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        {generateIdioms && (
                                            <div className="mt-2 flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="40"
                                                    step="5"
                                                    value={generateIdiomsPct}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        const currentPv = generatePhrasalVerbs ? generatePhrasalVerbsPct : 0;
                                                        if (val + currentPv <= 50) {
                                                            setGenerateIdiomsPct(val);
                                                        }
                                                    }}
                                                    className="flex-1 accent-violet-600 h-1.5 rounded-full bg-slate-200 appearance-none outline-none"
                                                />
                                                <span className="text-xs font-medium text-slate-500 w-10 text-right">{generateIdiomsPct}%</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Distribution Bar */}
                                    <div className="pt-2">
                                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                            <span>Single Words ({100 - (generatePhrasalVerbs ? generatePhrasalVerbsPct : 0) - (generateIdioms ? generateIdiomsPct : 0)}%)</span>
                                            {generatePhrasalVerbs && <span>Phrasal Verbs ({generatePhrasalVerbsPct}%)</span>}
                                            {generateIdioms && <span>Idioms ({generateIdiomsPct}%)</span>}
                                        </div>
                                        <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-100">
                                            <div
                                                className="h-full bg-emerald-400 transition-all duration-300"
                                                style={{ width: `${100 - (generatePhrasalVerbs ? generatePhrasalVerbsPct : 0) - (generateIdioms ? generateIdiomsPct : 0)}%` }}
                                            />
                                            {generatePhrasalVerbs && (
                                                <div
                                                    className="h-full bg-violet-400 transition-all duration-300"
                                                    style={{ width: `${generatePhrasalVerbsPct}%` }}
                                                />
                                            )}
                                            {generateIdioms && (
                                                <div
                                                    className="h-full bg-amber-400 transition-all duration-300"
                                                    style={{ width: `${generateIdiomsPct}%` }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {generateTarget && (
                                <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2 text-xs text-violet-700">
                                    <strong>Enriching:</strong> {generateTarget.total_words ?? 0} existing words will be excluded from generation.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Btn.Secondary
                                onClick={() => setGenerateOpen(false)}
                                disabled={generating}
                            >
                                {generateSuccess ? "Close" : "Cancel"}
                            </Btn.Secondary>

                            {!generateSuccess && (
                                <Btn.Primary onClick={handleGenerate} disabled={generating}>
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Generating…
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            {generateTarget ? "Enrich Collection" : "Generate Collection"}
                                        </>
                                    )}
                                </Btn.Primary>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function CollectionThumbnail({ imageKey, bgColor }: { imageKey?: string | null; bgColor?: string | null }) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!imageKey) return;
        let cancelled = false;
        filesApi.getPresignedUrl(imageKey, "spelo-images").then((res) => {
            if (!cancelled && res.success && res.url) setUrl(res.url);
        }).catch(() => { });
        return () => { cancelled = true; };
    }, [imageKey]);

    if (url) {
        return (
            <div
                className="h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: bgColor || "#f1f5f9" }}
            >
                <img
                    src={url}
                    alt=""
                    className="h-8 w-8 object-contain"
                />
            </div>
        );
    }

    return (
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
            <Folder className="w-5 h-5" />
        </div>
    );
}


export default CollectionsPage;

