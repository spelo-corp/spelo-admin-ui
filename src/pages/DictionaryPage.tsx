import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    Plus,
    BookOpen,
    Edit3,
    Trash2,
    Volume2,
    Wand2,
    Loader2,
    Sparkles,
} from "lucide-react";

import { api } from "../api/client";
import type { VocabWord } from "../types";

import VocabModal, { type VocabFormData } from "../components/vocab/VocabModal";
import VocabAutoCreateSection from "../components/vocab/VocabAutoCreateSection";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const SkeletonCard = () => (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="relative space-y-3 animate-pulse">
            <div className="h-5 w-28 rounded-full bg-slate-200" />
            <div className="h-4 w-20 rounded-full bg-slate-200" />
            <div className="h-4 w-16 rounded-full bg-slate-200" />
            <div className="h-4 w-full rounded-full bg-slate-200" />
            <div className="h-4 w-3/4 rounded-full bg-slate-200" />
        </div>
    </div>
);

const DictionaryPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const size = 500;

    const [words, setWords] = useState<VocabWord[]>([]);
    const [total, setTotal] = useState(0);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAutoCreate, setShowAutoCreate] = useState(false);
    const [editWord, setEditWord] = useState<VocabWord | null>(null);
    const [searching, setSearching] = useState(false);

    const loadWords = useCallback(async () => {
        setLoading(true);
        setSearching(true);
        try {
            const res = await api.getVocab({ q: search, page, size });
            if (res.success) {
                setWords(res.data);
                setTotal(res.total);
            }
        } catch (err) {
            console.error("Failed to load vocab:", err);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    }, [page, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadWords();
        }, 220);

        return () => clearTimeout(timer);
    }, [loadWords]);

    const groupedWords = useMemo(() => {
        const groups: Record<string, VocabWord[]> = {};

        for (const w of words) {
            const first = w.word[0]?.toUpperCase() ?? "#";
            if (!groups[first]) groups[first] = [];
            groups[first].push(w);
        }

        alphabet.forEach((l) => {
            if (!groups[l]) groups[l] = [];
            else groups[l].sort((a, b) => a.word.localeCompare(b.word));
        });

        return groups;
    }, [words]);

    const visibleLetters = useMemo(
        () => alphabet.filter((l) => (groupedWords[l] ?? []).length > 0),
        [groupedWords]
    );

    const playAudio = (url: string | null) => {
        if (url) new Audio(url).play();
    };

    const openEditModal = (word: VocabWord) => {
        setEditWord(word);
        setShowEditModal(true);
    };

    const openCreateModal = () => setShowCreateModal(true);
    const openAutoCreateSection = () => setShowAutoCreate(true);

    const handleSearchSubmit = () => {
        setPage(1);
        void loadWords();
    };

    const toModalData = (w: VocabWord): VocabFormData => ({
        word: w.word,
        ipa: w.word_definition?.pronunciations?.[0]?.ipa || "",
        definition: w.word_definition?.meaning?.definition || "",
        translation: w.word_definition?.meaning?.translation || "",
        example: w.word_definition?.meaning?.example || "",
    });

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/5 via-white to-slate-50" />

            <div className="relative z-10 px-4 pb-12 pt-6 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
                    {/* LEFT — Actions + Alphabet rail */}
                    <aside className="hidden h-[calc(100vh-80px)] flex-col gap-4 lg:flex sticky top-6">
                        <div className="rounded-card border border-slate-100 bg-white/80 p-4 shadow-card backdrop-blur">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-2">
                                Quick actions
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark"
                                >
                                    <Plus className="h-4 w-4" />
                                    New word
                                </button>
                                <button
                                    onClick={openAutoCreateSection}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-black"
                                >
                                    <Wand2 className="h-4 w-4" />
                                    AI auto-create
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden rounded-card border border-slate-100 bg-white/80 p-4 shadow-card backdrop-blur">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                    Alphabet
                                </p>
                                <span className="text-[11px] text-slate-400">
                                    {visibleLetters.length} active
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                                {alphabet.map((l) => {
                                    const hasWords = (groupedWords[l] ?? []).length > 0;
                                    return (
                                        <button
                                            key={l}
                                            onClick={() => {
                                                const sec = document.getElementById(`section-${l}`);
                                                sec?.scrollIntoView({ behavior: "smooth", block: "start" });
                                            }}
                                            disabled={!hasWords}
                                            className={`rounded-lg px-3 py-2 transition ${
                                                hasWords
                                                    ? "bg-slate-50 text-slate-800 hover:bg-brand/10 hover:text-brand"
                                                    : "bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="space-y-6">
                        <div className="relative overflow-hidden rounded-shell border border-slate-100 bg-white/90 p-6 shadow-shell backdrop-blur md:p-8">
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-slate-100" />
                            <div className="relative flex flex-col gap-6">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                                            Vocabulary
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                                <BookOpen className="h-6 w-6" />
                                            </span>
                                            <div>
                                                <h1 className="text-3xl font-semibold text-slate-900">
                                                    Dictionary
                                                </h1>
                                                <p className="text-sm text-slate-500">
                                                    Curated, polished words with IPA, meaning, and examples.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={openCreateModal}
                                            className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-brand hover:text-brand md:inline-flex"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add word
                                        </button>
                                        <button
                                            onClick={openAutoCreateSection}
                                            className="hidden items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-black md:inline-flex"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            AI batch
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSearchSubmit();
                                            }}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-800 shadow-inner shadow-slate-100 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                                            placeholder="Search by word, meaning, or IPA…"
                                        />
                                        <div className="absolute right-2 top-2 flex items-center gap-2">
                                            {search && (
                                                <button
                                                    onClick={() => {
                                                        setSearch("");
                                                        setPage(1);
                                                    }}
                                                    className="rounded-full px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                            <button
                                                onClick={handleSearchSubmit}
                                                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark"
                                            >
                                                {searching ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Search className="h-4 w-4" />
                                                )}
                                                Refresh
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                        <span className="rounded-full bg-brand/10 px-3 py-1.5 font-semibold text-brand">
                                            {total} words
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                                            Showing {words.length} results
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                                            Page {page}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                                        {alphabet.map((l) => {
                                            const hasWords = (groupedWords[l] ?? []).length > 0;
                                            return (
                                                <button
                                                    key={l}
                                                    onClick={() => {
                                                        const sec = document.getElementById(`section-${l}`);
                                                        sec?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                    }}
                                                    disabled={!hasWords}
                                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                                        hasWords
                                                            ? "bg-slate-200 text-slate-800 hover:bg-brand/20 hover:text-brand"
                                                            : "bg-slate-100 text-slate-400"
                                                    }`}
                                                >
                                                    {l}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {loading ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <SkeletonCard key={i} />
                                    ))}
                                </div>
                            ) : visibleLetters.length === 0 ? (
                                <div className="rounded-card border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-card">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                        <Search className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800">No words yet</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Try a different search, or add a new word to kick things off.
                                    </p>
                                    <div className="mt-4 flex items-center justify-center gap-3">
                                        <button
                                            onClick={openCreateModal}
                                            className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-dark"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add word
                                        </button>
                                        <button
                                            onClick={openAutoCreateSection}
                                            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                                        >
                                            <Wand2 className="h-4 w-4" />
                                            AI create
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                visibleLetters.map((letter) => {
                                    const list = groupedWords[letter] ?? [];

                                    return (
                                        <section key={letter} id={`section-${letter}`} className="scroll-mt-24">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                                    {letter}
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                        Letter
                                                    </p>
                                                    <h2 className="text-xl font-semibold text-slate-800">
                                                        {letter} · {list.length} words
                                                    </h2>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {list.map((w) => {
                                                    const m = w.word_definition.meaning;
                                                    const pronunciations = w.word_definition.pronunciations ?? [];

                                                    return (
                                                        <article
                                                            key={w.id}
                                                            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                                                        >
                                                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand/40 via-brand to-emerald-500 opacity-0 transition group-hover:opacity-100" />
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <h3 className="text-xl font-semibold text-slate-900">
                                                                            {w.word}
                                                                        </h3>
                                                                        {pronunciations[0]?.ipa && (
                                                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                                                {pronunciations[0].ipa}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                                                        {pronunciations.map((p) => p.ipa).join(" • ")}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => openEditModal(w)}
                                                                        className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                                                                        title="Edit word"
                                                                    >
                                                                        <Edit3 className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:-translate-y-0.5 hover:border-rose-200 hover:text-rose-500"
                                                                        title="Delete word"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <p className="mt-3 text-base leading-relaxed text-slate-800">
                                                                {m.definition}
                                                            </p>
                                                            <p className="mt-2 font-semibold text-brand">
                                                                → {m.translation}
                                                            </p>
                                                            <p className="mt-1 text-sm italic text-slate-500">
                                                                “{m.example}”
                                                            </p>

                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {pronunciations.map((p, idx) => (
                                                                    <button
                                                                        key={`${p.dialect}-${idx}`}
                                                                        className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                                                                        onClick={() => playAudio(p.audio)}
                                                                    >
                                                                        <Volume2 className="h-4 w-4" />
                                                                        {p.dialect || "Listen"}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })
                            )}
                        </div>
                    </main>
                </div>
            </div>

            <VocabAutoCreateSection
                show={showAutoCreate}
                onClose={() => setShowAutoCreate(false)}
            />

            <VocabModal
                show={showCreateModal}
                mode="create"
                onClose={() => setShowCreateModal(false)}
                onSubmit={async (form) => {
                    const res = await api.createVocab(form);
                    if (res.success) {
                        setShowCreateModal(false);
                        void loadWords();
                    }
                }}
            />

            <VocabModal
                show={showEditModal}
                mode="edit"
                initialData={editWord ? toModalData(editWord) : undefined}
                onClose={() => setShowEditModal(false)}
                onSubmit={async (form) => {
                    if (!editWord) return;
                    const res = await api.updateVocab(editWord.id, form);
                    if (res.success) {
                        setShowEditModal(false);
                        setEditWord(null);
                        void loadWords();
                    }
                }}
            />
        </div>
    );
};

export default DictionaryPage;
