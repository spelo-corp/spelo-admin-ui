import React, { useEffect, useState } from "react";
import { Search, Plus, BookOpen, Edit3, Trash2, Volume2 } from "lucide-react";
import { api } from "../api/client";
import type { VocabWord } from "../types";
import VocabModal, {type VocabFormData } from "../components/vocab/VocabModal";

const DictionaryPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [size] = useState(10);

    const [words, setWords] = useState<VocabWord[]>([]);
    const [total, setTotal] = useState(0);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editWord, setEditWord] = useState<VocabWord | null>(null);

    const loadWords = async () => {
        setLoading(true);
        try {
            const res = await api.getVocab({ q: search, page, size });
            if (res.success) {
                setWords(res.data);
                setTotal(res.total);
            }
        } catch (err) {
            console.error("Failed to load vocab:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadWords();
    }, [page]);

    // GROUP WORDS A–Z
    const groupWords = (words: VocabWord[]) => {
        const map: Record<string, VocabWord[]> = {};

        for (const w of words) {
            const first = w.word[0]?.toUpperCase() || "#";
            if (!map[first]) map[first] = [];
            map[first].push(w);
        }

        // Ensure A–Z always exist
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l) => {
            if (!map[l]) map[l] = [];
        });

        return map;
    };

    const groupedWords = groupWords(words);

    const playAudio = (url: string | null) => {
        if (url) new Audio(url).play();
    };

    const openCreateModal = () => setShowCreateModal(true);

    const openEditModal = (word: VocabWord) => {
        setEditWord(word);
        setShowEditModal(true);
    };

    // Prepare edit data for modal
    const mapWordToModalData = (w: VocabWord): VocabFormData => ({
        word: w.word,
        ipa: w.word_definition?.pronunciations?.[0]?.ipa || "",
        definition: w.word_definition?.meaning?.definition || "",
        translation: w.word_definition?.meaning?.translation || "",
        example: w.word_definition?.meaning?.example || "",
    });

    const SkeletonCard = () => (
        <div className="bg-white border rounded-xl p-4 shadow-sm animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded mb-3" />
            <div className="h-4 w-20 bg-slate-200 rounded mb-1" />
            <div className="h-4 w-16 bg-slate-200 rounded mb-1" />
            <div className="h-4 w-full bg-slate-200 rounded mt-3" />
            <div className="h-4 w-3/4 bg-slate-200 rounded mt-2" />
        </div>
    );

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="text-brand w-6 h-6" />
                    Dictionary
                </h1>
                <p className="text-slate-500 text-sm">
                    {total} words found
                </p>

                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-card"
                >
                    <Plus className="w-5 h-5" /> Add Word
                </button>
            </div>

            {/* SEARCH BAR */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 pr-4 py-2 w-full border rounded-card"
                        placeholder="Search vocabulary..."
                    />
                </div>

                <button
                    className="btn-secondary px-4 py-2 rounded-card"
                    onClick={() => {
                        setPage(1);
                        loadWords();
                    }}
                >
                    Search
                </button>
            </div>

            {/* SCROLLABLE A–Z WORD LIST */}
            <div className="max-h-[70vh] overflow-y-auto pr-2">
                {loading ? (
                    // SKELETON GRID
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : (
                    // REAL WORD LIST
                    Object.keys(groupedWords).map((letter) => {
                        const list = groupedWords[letter];
                        if (list.length === 0) return null;

                        return (
                            <div key={letter} id={`section-${letter}`} className="mb-6 scroll-mt-24">
                                <h2 className="text-lg font-bold text-slate-700 mb-2">{letter}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {list.map((w) => {
                                        const meaning = w.word_definition?.meaning;
                                        const pronunciations = w.word_definition?.pronunciations ?? [];

                                        return (
                                            <div
                                                key={w.id}
                                                className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
                                            >
                                                <div className="flex justify-between">
                                                    <div>
                                                        <h2 className="text-xl font-bold">{w.word}</h2>
                                                        <div className="flex gap-3 text-slate-500 text-sm mt-1">
                                                            {pronunciations.map((p, idx) => (
                                                                <span key={idx}>{p.ipa}</span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button onClick={() => openEditModal(w)} className="btn-icon">
                                                            <Edit3 className="w-5 h-5 text-brand" />
                                                        </button>
                                                        <button className="btn-icon">
                                                            <Trash2 className="w-5 h-5 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="mt-3">{meaning.definition}</p>
                                                <p className="text-brand mt-1">→ {meaning.translation}</p>
                                                <p className="italic text-slate-400 mt-1">"{meaning.example}"</p>

                                                <div className="flex gap-2 mt-3">
                                                    {pronunciations.map((p, idx) => (
                                                        <button
                                                            key={idx}
                                                            className="border px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                                            onClick={() => playAudio(p.audio)}
                                                        >
                                                            <Volume2 className="w-4 h-4" />
                                                            {p.dialect}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* A–Z Sticky Sidebar */}
            <div className="hidden md:flex flex-col items-center gap-1 fixed right-4 top-32">
                {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                    <button
                        key={letter}
                        onClick={() => {
                            const section = document.getElementById(`section-${letter}`);
                            if (section) section.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-xs text-slate-500 hover:text-brand px-1"
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {/* CREATE MODAL */}
            <VocabModal
                show={showCreateModal}
                mode="create"
                onClose={() => setShowCreateModal(false)}
                onSubmit={async (form) => {
                    try {
                        const res = await api.createVocab(form);
                        if (res.success) {
                            setShowCreateModal(false);
                            loadWords();
                        }
                    } catch {
                        console.error("Failed to create word");
                    }
                }}
            />

            {/* EDIT MODAL */}
            <VocabModal
                show={showEditModal}
                mode="edit"
                initialData={editWord ? mapWordToModalData(editWord) : undefined}
                onClose={() => setShowEditModal(false)}
                onSubmit={async (form) => {
                    if (!editWord) return;
                    try {
                        const res = await api.updateVocab(editWord.id, form);
                        if (res.success) {
                            setShowEditModal(false);
                            setEditWord(null);
                            loadWords();
                        }
                    } catch {
                        console.error("Failed to update word");
                    }
                }}
            />
        </div>
    );
};

export default DictionaryPage;
