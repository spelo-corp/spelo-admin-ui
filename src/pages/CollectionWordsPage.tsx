import {
    ArrowLeft,
    BookOpen,
    Check,
    ImagePlus,
    Loader2,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { ConfirmModal } from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import {
    useAddTerminologiesToCollection,
    useCollections,
    useCollectionTerminologies,
    useDeleteCollection,
    useDeleteWordFromCollection,
    useGroupedLibraryCollections,
    useUpdateCollection,
    useUploadCollectionImage,
} from "../hooks/useCollections";
import type { VocabWord } from "../types";
import type { CollectionTerminologyDTO } from "../types/collection";

const getWordMeaning = (word: VocabWord) => {
    const sense = word.senses?.[0];
    return sense?.definition ?? sense?.translation ?? "";
};

const POS_COLORS: Record<string, string> = {
    noun: "bg-sky-100 text-sky-700",
    verb: "bg-emerald-100 text-emerald-700",
    adjective: "bg-violet-100 text-violet-700",
    adverb: "bg-amber-100 text-amber-700",
    phrasal_verb: "bg-orange-100 text-orange-700",
    idiom: "bg-rose-100 text-rose-700",
};

const posColor = (pos?: string) => {
    if (!pos) return "bg-slate-100 text-slate-600";
    return POS_COLORS[pos.toLowerCase()] ?? "bg-slate-100 text-slate-600";
};

interface TerminologyDetailPanelProps {
    item: CollectionTerminologyDTO;
}

const TerminologyDetailPanel: React.FC<TerminologyDetailPanelProps> = ({ item }) => {
    const definition = item.definition?.answer ?? "";
    const translation = item.translation;
    const ipa = item.ipa;
    const pos = item.pos;
    const examples = item.examples ?? [];

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-3 flex-wrap">
                <span className="text-lg font-bold text-slate-900">{item.terminology}</span>
                {pos ? (
                    <span
                        className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${posColor(pos)}`}
                    >
                        {pos}
                    </span>
                ) : null}
            </div>

            {ipa ? <p className="text-sm text-slate-500 font-mono">/{ipa}/</p> : null}

            {definition ? (
                <p className="text-sm text-slate-700 leading-relaxed">{definition}</p>
            ) : (
                <p className="text-sm text-slate-400 italic">No definition available.</p>
            )}

            {translation ? (
                <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Translation:</span> {translation}
                </p>
            ) : null}

            {examples.length > 0 ? (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        Examples
                    </p>
                    {examples.slice(0, 3).map((ex) => (
                        <div key={ex.sentence ?? ex.translation} className="space-y-0.5">
                            <p className="text-xs text-slate-600 italic">"{ex.sentence}"</p>
                            {ex.translation ? (
                                <p className="text-xs text-slate-400">{ex.translation}</p>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

const CollectionWordsPage: React.FC = () => {
    const navigate = useNavigate();
    const { collectionId } = useParams();
    const parsedId = Number(collectionId);
    const hasValidId = Number.isFinite(parsedId) && parsedId > 0;

    const { data: collections = [], isLoading: collectionsLoading } = useCollections();
    const { data: groupedLibraryResponse } = useGroupedLibraryCollections();
    const groupedLibraryGroups = groupedLibraryResponse?.data ?? [];
    const collection = useMemo(() => {
        // First check user's own collections
        const own = collections.find((item) => item.id === parsedId);
        if (own) return own;
        // Then check library collections (book vocab)
        for (const group of groupedLibraryGroups) {
            const found = group.collections?.find((c) => c.id === parsedId);
            if (found) return { id: found.id, name: found.name, word_count: found.word_count };
        }
        return undefined;
    }, [collections, groupedLibraryGroups, parsedId]);

    const {
        data: terminologies = [],
        isLoading: terminologiesLoading,
        error: terminologiesError,
    } = useCollectionTerminologies(parsedId, hasValidId);

    const addTerminologiesMutation = useAddTerminologiesToCollection();
    const deleteWordMutation = useDeleteWordFromCollection();
    const deleteCollectionMutation = useDeleteCollection();
    const updateCollectionMutation = useUpdateCollection();
    const uploadImageMutation = useUploadCollectionImage();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [collectionSearch, setCollectionSearch] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState("");
    const [editError, setEditError] = useState<string | null>(null);
    const [showDeleteCollectionModal, setShowDeleteCollectionModal] = useState(false);
    const [deleteCollectionError, setDeleteCollectionError] = useState<string | null>(null);
    const [uploadImageError, setUploadImageError] = useState<string | null>(null);
    const [uploadImageSuccess, setUploadImageSuccess] = useState(false);
    const [wordSearch, setWordSearch] = useState("");
    const [wordResults, setWordResults] = useState<VocabWord[]>([]);
    const [wordSearchLoading, setWordSearchLoading] = useState(false);
    const [wordSearchError, setWordSearchError] = useState<string | null>(null);
    const [selectedWords, setSelectedWords] = useState<VocabWord[]>([]);
    const [addError, setAddError] = useState<string | null>(null);
    const [selectedTerminologyId, setSelectedTerminologyId] = useState<number | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<CollectionTerminologyDTO | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleOpenEdit = () => {
        setEditName(collection?.name ?? "");
        setEditError(null);
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        const trimmed = editName.trim();
        if (!trimmed) {
            setEditError("Collection name cannot be empty.");
            return;
        }
        setEditError(null);
        try {
            await updateCollectionMutation.mutateAsync({
                id: parsedId,
                data: { collection_name: trimmed },
            });
            setShowEditModal(false);
        } catch (e) {
            setEditError(e instanceof Error ? e.message : "Failed to update collection.");
        }
    };

    const handleDeleteCollection = async () => {
        setDeleteCollectionError(null);
        try {
            await deleteCollectionMutation.mutateAsync(parsedId);
            setShowDeleteCollectionModal(false);
            navigate("/admin/collections");
        } catch (e) {
            setDeleteCollectionError(
                e instanceof Error ? e.message : "Failed to delete collection.",
            );
        }
    };

    const handleUploadImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadImageError(null);
        setUploadImageSuccess(false);
        try {
            await uploadImageMutation.mutateAsync({ id: parsedId, file });
            setUploadImageSuccess(true);
            setTimeout(() => setUploadImageSuccess(false), 3000);
        } catch (err) {
            setUploadImageError(err instanceof Error ? err.message : "Failed to upload image.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSearchWords = async () => {
        const term = wordSearch.trim();
        if (!term) {
            setWordSearchError("Enter a word to search.");
            setWordResults([]);
            return;
        }

        setWordSearchError(null);
        setWordSearchLoading(true);
        setAddError(null);
        try {
            const res = await api.getVocab({ q: term, page: 1, size: 20 });
            setWordResults(res?.data ?? []);
        } catch (e) {
            setWordSearchError(e instanceof Error ? e.message : "Failed to search dictionary.");
            setWordResults([]);
        } finally {
            setWordSearchLoading(false);
        }
    };

    const handleSelectWord = (word: VocabWord) => {
        setSelectedWords((prev) =>
            prev.some((item) => item.id === word.id) ? prev : [...prev, word],
        );
        setAddError(null);
    };

    const handleRemoveSelectedWord = (wordId: number) => {
        setSelectedWords((prev) => prev.filter((item) => item.id !== wordId));
    };

    const handleAddWordsSubmit = async () => {
        if (!hasValidId) return;

        if (selectedWords.length === 0) {
            setAddError("Select at least one word to add.");
            return;
        }

        setAddError(null);

        const payload = selectedWords.map((word) => ({
            terminology: word.lemma || word.word || "",
            word_id: word.id,
            collection_id: parsedId,
        }));

        try {
            await addTerminologiesMutation.mutateAsync(payload);
            setSelectedWords([]);
        } catch (e) {
            setAddError(e instanceof Error ? e.message : "Failed to add words to collection.");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteError(null);
        try {
            await deleteWordMutation.mutateAsync({
                collectionId: deleteTarget.collection_id,
                wordId: deleteTarget.word_id,
            });
            if (selectedTerminologyId === deleteTarget.word_id) {
                setSelectedTerminologyId(null);
            }
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : "Failed to remove word.");
        }
    };

    const filteredTerminologies = useMemo(() => {
        const term = collectionSearch.trim().toLowerCase();
        if (!term) return terminologies;
        return terminologies.filter((item) => {
            const definition = item.definition?.answer ?? "";
            const translation = item.translation ?? "";
            return (
                item.terminology.toLowerCase().includes(term) ||
                definition.toLowerCase().includes(term) ||
                translation.toLowerCase().includes(term)
            );
        });
    }, [collectionSearch, terminologies]);

    useEffect(() => {
        if (filteredTerminologies.length === 0) {
            setSelectedTerminologyId(null);
            return;
        }
        if (
            !selectedTerminologyId ||
            !filteredTerminologies.some((item) => item.word_id === selectedTerminologyId)
        ) {
            setSelectedTerminologyId(filteredTerminologies[0].word_id);
        }
    }, [filteredTerminologies, selectedTerminologyId]);

    const selectedTerminology = useMemo(
        () => filteredTerminologies.find((item) => item.word_id === selectedTerminologyId) ?? null,
        [filteredTerminologies, selectedTerminologyId],
    );

    const addingWords = addTerminologiesMutation.isPending;
    const deletingWord = deleteWordMutation.isPending;

    if (!hasValidId) {
        return (
            <div className="space-y-6 px-8 py-6">
                <PageHeader
                    title="Collection not found"
                    description="The collection ID is invalid."
                    actions={
                        <Btn.Secondary onClick={() => navigate("/admin/collections")}>
                            <ArrowLeft className="w-4 h-4" />
                            Back to collections
                        </Btn.Secondary>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader
                badge={
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        <Sparkles className="w-3.5 h-3.5" />
                        Collection Words
                    </div>
                }
                title={collection?.name ?? `Collection #${parsedId}`}
                titleAddon={
                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                        {terminologies.length} words
                    </span>
                }
                description="Browse current words in this collection and search the dictionary to add more."
                actions={
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadImageChange}
                        />
                        <Btn.HeroSecondary
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadImageMutation.isPending}
                            title="Upload collection image"
                        >
                            {uploadImageMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading…
                                </>
                            ) : uploadImageSuccess ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Uploaded
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="w-4 h-4" />
                                    Upload Image
                                </>
                            )}
                        </Btn.HeroSecondary>
                        <Btn.HeroSecondary onClick={handleOpenEdit} title="Edit collection name">
                            <Pencil className="w-4 h-4" />
                            Edit
                        </Btn.HeroSecondary>
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteCollectionError(null);
                                setShowDeleteCollectionModal(true);
                            }}
                            className="px-4 py-2 rounded-full bg-rose-500/20 border border-rose-300/30 text-white font-semibold hover:bg-rose-500/40 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Delete collection"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                        <Btn.HeroSecondary onClick={() => navigate("/admin/collections")}>
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Btn.HeroSecondary>
                    </>
                }
            />

            <div className="collections-layout">
                <section className="collections-layout__left bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                    Words
                                </p>
                                <p className="text-sm text-slate-600">
                                    {filteredTerminologies.length} showing
                                </p>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={collectionSearch}
                                onChange={(e) => setCollectionSearch(e.target.value)}
                                placeholder="Filter collection words"
                                className="rounded-xl pl-9"
                            />
                        </div>
                    </div>

                    {/* Word detail panel */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-3">
                            Word detail
                        </p>
                        {selectedTerminology ? (
                            <TerminologyDetailPanel item={selectedTerminology} />
                        ) : (
                            <p className="text-sm text-slate-500">
                                Select a word to see its details.
                            </p>
                        )}
                    </div>

                    {deleteError ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {deleteError}
                        </div>
                    ) : null}

                    {terminologiesError ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {terminologiesError instanceof Error
                                ? terminologiesError.message
                                : "Failed to load collection words."}
                        </div>
                    ) : null}

                    {terminologiesLoading || collectionsLoading ? (
                        <div className="space-y-2">
                            {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
                                <Skeleton key={k} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : filteredTerminologies.length === 0 ? (
                        <div className="text-center py-10 text-sm text-slate-500">
                            No words in this collection yet.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                            {filteredTerminologies.map((item) => {
                                const isSelected = selectedTerminologyId === item.word_id;
                                const definition = item.definition?.answer ?? "";
                                const pos = item.pos;
                                const translation = item.translation;
                                const ipa = item.ipa;

                                return (
                                    <div
                                        key={`${item.word_id}-${item.terminology}`}
                                        className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${
                                            isSelected
                                                ? "border-brand/40 bg-brand/10"
                                                : "border-slate-100 bg-slate-50/60 hover:bg-slate-50"
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="min-w-0 flex-1 text-left"
                                            onClick={() => setSelectedTerminologyId(item.word_id)}
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {item.terminology}
                                                </p>
                                                {pos ? (
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${posColor(pos)}`}
                                                    >
                                                        {pos}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {ipa ? (
                                                <p className="text-[11px] text-slate-400 font-mono">
                                                    /{ipa}/
                                                </p>
                                            ) : null}
                                            {definition ? (
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                                    {definition}
                                                </p>
                                            ) : null}
                                            {!definition && translation ? (
                                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                    {translation}
                                                </p>
                                            ) : null}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeleteTarget(item);
                                                setDeleteError(null);
                                            }}
                                            className="shrink-0 rounded-full p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                                            title="Remove from collection"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="collections-layout__right bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                Search dictionary
                            </p>
                            <p className="text-sm text-slate-600">{wordResults.length} results</p>
                        </div>
                        <span className="text-[11px] text-slate-400">
                            {selectedWords.length} selected
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={wordSearch}
                                onChange={(e) => {
                                    setWordSearch(e.target.value);
                                    if (wordSearchError) setWordSearchError(null);
                                }}
                                placeholder="Search by word or meaning"
                                className="rounded-xl pl-9"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearchWords();
                                }}
                            />
                        </div>
                        <Btn.Secondary
                            onClick={handleSearchWords}
                            disabled={wordSearchLoading}
                            className="justify-center"
                        >
                            {wordSearchLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Searching
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    Search
                                </>
                            )}
                        </Btn.Secondary>
                    </div>

                    {wordSearchError ? (
                        <div className="text-xs text-rose-600">{wordSearchError}</div>
                    ) : null}

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {wordSearchLoading ? (
                            <div className="text-xs text-slate-400">Searching…</div>
                        ) : wordResults.length === 0 ? (
                            <div className="text-xs text-slate-400">
                                {wordSearch.trim()
                                    ? "No matches found."
                                    : "Search to see dictionary results."}
                            </div>
                        ) : (
                            wordResults.map((word) => {
                                const isSelected = selectedWords.some(
                                    (item) => item.id === word.id,
                                );
                                const meaning = getWordMeaning(word);
                                const wordPos = word.senses?.[0]?.pos;
                                const wordIpa = word.pronunciations?.[0]?.ipa;
                                return (
                                    <div
                                        key={word.id}
                                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {word.lemma}
                                                </p>
                                                {wordPos ? (
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${posColor(wordPos)}`}
                                                    >
                                                        {wordPos}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {wordIpa ? (
                                                <p className="text-[11px] text-slate-400 font-mono">
                                                    /{wordIpa}/
                                                </p>
                                            ) : null}
                                            {meaning ? (
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                    {meaning}
                                                </p>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectWord(word)}
                                            disabled={isSelected}
                                            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                                                isSelected
                                                    ? "bg-emerald-100 text-emerald-700 cursor-default"
                                                    : "bg-brand/10 text-brand hover:bg-brand/20"
                                            }`}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    Added
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Selected words
                            </p>
                            <span className="text-[11px] text-slate-400">
                                {selectedWords.length} selected
                            </span>
                        </div>

                        {selectedWords.length === 0 ? (
                            <p className="text-xs text-slate-400">
                                Pick words from the search results to stage them here.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {selectedWords.map((word) => {
                                    const meaning = getWordMeaning(word);
                                    return (
                                        <div
                                            key={word.id}
                                            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {word.word ?? word.lemma}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    ID #{word.id}
                                                </p>
                                                {meaning ? (
                                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                        {meaning}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSelectedWord(word.id)}
                                                className="shrink-0 rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {addError ? <div className="text-xs text-rose-600">{addError}</div> : null}

                    <div className="flex justify-end">
                        <Btn.Primary onClick={handleAddWordsSubmit} disabled={addingWords}>
                            {addingWords ? "Adding..." : "Add to collection"}
                        </Btn.Primary>
                    </div>
                </section>
            </div>

            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => {
                    if (!deletingWord) {
                        setDeleteTarget(null);
                        setDeleteError(null);
                    }
                }}
                onConfirm={handleDeleteConfirm}
                title="Remove word from collection"
                description={
                    deleteTarget ? (
                        <span>
                            Remove{" "}
                            <span className="font-semibold text-slate-800">
                                {deleteTarget.terminology}
                            </span>{" "}
                            from this collection? The word itself will not be deleted from the
                            dictionary.
                        </span>
                    ) : (
                        ""
                    )
                }
                confirmText="Remove"
                cancelText="Cancel"
                isDestructive
                isConfirming={deletingWord}
            />

            <ConfirmModal
                isOpen={showDeleteCollectionModal}
                onClose={() => {
                    if (!deleteCollectionMutation.isPending) {
                        setShowDeleteCollectionModal(false);
                        setDeleteCollectionError(null);
                    }
                }}
                onConfirm={handleDeleteCollection}
                title="Delete collection"
                description={
                    <span>
                        Permanently delete{" "}
                        <span className="font-semibold text-slate-800">
                            {collection?.name ?? `Collection #${parsedId}`}
                        </span>
                        ? This will remove the collection and all its words. This action cannot be
                        undone.
                        {deleteCollectionError ? (
                            <span className="block mt-3 text-rose-600 text-sm">
                                {deleteCollectionError}
                            </span>
                        ) : null}
                    </span>
                }
                confirmText="Delete collection"
                cancelText="Cancel"
                isDestructive
                isConfirming={deleteCollectionMutation.isPending}
            />

            {showEditModal ? (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-slate-900">
                                    Edit collection
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!updateCollectionMutation.isPending) {
                                            setShowEditModal(false);
                                            setEditError(null);
                                        }
                                    }}
                                    className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                                    disabled={updateCollectionMutation.isPending}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="edit-collection-name"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Collection name
                                </label>
                                <Input
                                    id="edit-collection-name"
                                    value={editName}
                                    onChange={(e) => {
                                        setEditName(e.target.value);
                                        if (editError) setEditError(null);
                                    }}
                                    placeholder="Enter collection name"
                                    className="rounded-xl"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleEditSave();
                                    }}
                                    disabled={updateCollectionMutation.isPending}
                                />
                                {editError ? (
                                    <p className="text-xs text-rose-600">{editError}</p>
                                ) : null}
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
                            <Btn.Secondary
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditError(null);
                                }}
                                disabled={updateCollectionMutation.isPending}
                            >
                                Cancel
                            </Btn.Secondary>
                            <Btn.Primary
                                onClick={handleEditSave}
                                disabled={updateCollectionMutation.isPending}
                            >
                                {updateCollectionMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            ) : null}

            {uploadImageError ? (
                <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
                    <span>{uploadImageError}</span>
                    <button
                        type="button"
                        onClick={() => setUploadImageError(null)}
                        className="text-rose-400 hover:text-rose-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default CollectionWordsPage;
