import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BookOpen,
    Check,
    Loader2,
    Plus,
    Search,
    Sparkles,
    X,
} from "lucide-react";

import { api } from "../api/client";
import PageHeader from "../components/common/PageHeader";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import type { VocabWord } from "../types";
import {
    useAddTerminologiesToCollection,
    useCollectionTerminologies,
    useCollections,
} from "../hooks/useCollections";

const getWordMeaning = (word: VocabWord) => {
    const def = word.word_definition ?? word.wordDefinition;
    return def?.meaning?.definition ?? def?.meaning?.translation ?? "";
};

const CollectionWordsPage: React.FC = () => {
    const navigate = useNavigate();
    const { collectionId } = useParams();
    const parsedId = Number(collectionId);
    const hasValidId = Number.isFinite(parsedId) && parsedId > 0;

    const { data: collections = [], isLoading: collectionsLoading } = useCollections();
    const collection = useMemo(
        () => collections.find((item) => item.id === parsedId),
        [collections, parsedId]
    );

    const {
        data: terminologies = [],
        isLoading: terminologiesLoading,
        error: terminologiesError,
    } = useCollectionTerminologies(parsedId, hasValidId);

    const addTerminologiesMutation = useAddTerminologiesToCollection();

    const [collectionSearch, setCollectionSearch] = useState("");
    const [wordSearch, setWordSearch] = useState("");
    const [wordResults, setWordResults] = useState<VocabWord[]>([]);
    const [wordSearchLoading, setWordSearchLoading] = useState(false);
    const [wordSearchError, setWordSearchError] = useState<string | null>(null);
    const [selectedWords, setSelectedWords] = useState<VocabWord[]>([]);
    const [addError, setAddError] = useState<string | null>(null);
    const [selectedTerminologyId, setSelectedTerminologyId] = useState<number | null>(null);

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
        setSelectedWords((prev) => (
            prev.some((item) => item.id === word.id) ? prev : [...prev, word]
        ));
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
            terminology: word.word,
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

    const filteredTerminologies = useMemo(() => {
        const term = collectionSearch.trim().toLowerCase();
        if (!term) return terminologies;
        return terminologies.filter((item) => {
            const definition = item.definition?.answer ?? "";
            return (
                item.terminology.toLowerCase().includes(term) ||
                definition.toLowerCase().includes(term)
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
        () =>
            filteredTerminologies.find((item) => item.word_id === selectedTerminologyId) ??
            null,
        [filteredTerminologies, selectedTerminologyId]
    );

    const addingWords = addTerminologiesMutation.isPending;

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
                    <Btn.Secondary onClick={() => navigate("/admin/collections")}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to collections
                    </Btn.Secondary>
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
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Words</p>
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

                    <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Meaning
                        </p>
                        {selectedTerminology ? (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm text-slate-700">
                                    <span className="font-semibold">{selectedTerminology.terminology}</span>
                                    <span className="text-xs text-slate-400">
                                        ID #{selectedTerminology.word_id}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600">
                                    {selectedTerminology.definition?.answer
                                        ? selectedTerminology.definition.answer
                                        : "No definition available for this word."}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                Select a word to see its meaning.
                            </p>
                        )}
                    </div>

                    {terminologiesError ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {terminologiesError instanceof Error
                                ? terminologiesError.message
                                : "Failed to load collection words."}
                        </div>
                    ) : null}

                    {terminologiesLoading || collectionsLoading ? (
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredTerminologies.length === 0 ? (
                        <div className="text-center py-10 text-sm text-slate-500">
                            No words in this collection yet.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                            {filteredTerminologies.map((item) => (
                                <div
                                    key={`${item.word_id}-${item.terminology}`}
                                    className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 transition ${
                                        selectedTerminologyId === item.word_id
                                            ? "border-brand/40 bg-brand/10"
                                            : "border-slate-100 bg-slate-50/60 hover:bg-slate-50"
                                    }`}
                                    onClick={() => setSelectedTerminologyId(item.word_id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            setSelectedTerminologyId(item.word_id);
                                        }
                                    }}
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {item.terminology}
                                        </p>
                                        <p className="text-xs text-slate-400">Word ID #{item.word_id}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-brand/10 text-brand text-[11px] px-2.5 py-1">
                                        #{item.collection_id}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="collections-layout__right bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                Search dictionary
                            </p>
                            <p className="text-sm text-slate-600">
                                {wordResults.length} results
                            </p>
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
                                const isSelected = selectedWords.some((item) => item.id === word.id);
                                const meaning = getWordMeaning(word);
                                return (
                                    <div
                                        key={word.id}
                                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">{word.word}</p>
                                            <p className="text-xs text-slate-400">ID #{word.id}</p>
                                            {meaning ? (
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                    {meaning}
                                                </p>
                                            ) : null}
                                        </div>
                                        <button
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
                                                    {word.word}
                                                </p>
                                                <p className="text-xs text-slate-400">ID #{word.id}</p>
                                                {meaning ? (
                                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                        {meaning}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <button
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

                    {addError ? (
                        <div className="text-xs text-rose-600">{addError}</div>
                    ) : null}

                    <div className="flex justify-end">
                        <Btn.Primary onClick={handleAddWordsSubmit} disabled={addingWords}>
                            {addingWords ? "Adding..." : "Add to collection"}
                        </Btn.Primary>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CollectionWordsPage;
