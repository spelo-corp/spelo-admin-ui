import React, { useEffect, useState } from "react";
import {
    Search,
    Plus,
    BookOpen,
    Edit3,
    Trash2,
    Volume2,
    Wand2,
} from "lucide-react";

import { api } from "../api/client";
import type { VocabWord } from "../types";

import VocabModal, { type VocabFormData } from "../components/vocab/VocabModal";
import VocabAutoCreateSection from "../components/vocab/VocabAutoCreateSection";

// ----------------------
// Skeleton Card
// ----------------------
const SkeletonCard = () => (
    <div className="bg-white border rounded-xl p-4 shadow-sm animate-pulse">
        <div className="h-5 w-32 bg-slate-200 rounded mb-3" />
        <div className="h-4 w-20 bg-slate-200 rounded mb-1" />
        <div className="h-4 w-16 bg-slate-200 rounded mb-1" />
        <div className="h-4 w-full bg-slate-200 rounded mt-3" />
        <div className="h-4 w-3/4 bg-slate-200 rounded mt-2" />
    </div>
);

const DictionaryPage: React.FC = () => {
    // ----------------------
    // State
    // ----------------------
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [size] = useState(500); // Load big then filter A-Z client-side

    const [words, setWords] = useState<VocabWord[]>([]);
    const [total, setTotal] = useState(0);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAutoCreate, setShowAutoCreate] = useState(false);

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


    const groupWords = (list: VocabWord[]) => {
        const groups: Record<string, VocabWord[]> = {};

        for (const w of list) {
            const first = w.word[0]?.toUpperCase() ?? "#";
            if (!groups[first]) groups[first] = [];
            groups[first].push(w);
        }

        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l) => {
            if (!groups[l]) groups[l] = [];
        });

        return groups;
    };

    const groupedWords = groupWords(words);

    const playAudio = (url: string | null) => {
        if (url) new Audio(url).play();
    };

    const openEditModal = (word: VocabWord) => {
        setEditWord(word);
        setShowEditModal(true);
    };

    const openCreateModal = () => setShowCreateModal(true);
    const openAutoCreateSection = () => setShowAutoCreate(true);

    const toModalData = (w: VocabWord): VocabFormData => ({
        word: w.word,
        ipa: w.word_definition?.pronunciations?.[0]?.ipa || "",
        definition: w.word_definition?.meaning?.definition || "",
        translation: w.word_definition?.meaning?.translation || "",
        example: w.word_definition?.meaning?.example || "",
    });

    // ----------------------
    // UI
    // ----------------------
    return (
        <div className="p-6 flex gap-6">

            {/** -----------------------------------------
             * LEFT SIDEBAR — Alphabet Filters + Tools
             * ----------------------------------------- */}
            <div className="hidden md:flex flex-col w-20 items-center gap-2 sticky top-24">
                <button
                    onClick={openCreateModal}
                    className="w-full bg-brand text-white py-2 rounded-lg shadow flex items-center justify-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                </button>

                <button
                    onClick={openAutoCreateSection}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg shadow flex items-center justify-center gap-1"
                >
                    <Wand2 className="w-4 h-4" />
                </button>

                <div className="mt-4 flex flex-col items-center gap-1">
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                        <button
                            key={l}
                            onClick={() => {
                                const sec = document.getElementById(`section-${l}`);
                                sec?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-xs text-slate-500 hover:text-brand"
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/** -----------------------------------------
             * MAIN CONTENT
             * ----------------------------------------- */}
            <div className="flex-1">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="text-brand w-6 h-6" />
                            Dictionary
                        </h1>
                        <p className="text-slate-500 text-sm">{total} words</p>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="flex gap-2 mb-6">
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
                        onClick={() => {
                            setPage(1);
                            loadWords();
                        }}
                        className="btn-secondary px-4 py-2 rounded-card"
                    >
                        Search
                    </button>
                </div>

                {/* A-Z WORD LIST */}
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        Object.keys(groupedWords).map((letter) => {
                            const list = groupedWords[letter];
                            if (!list.length) return null;

                            return (
                                <div
                                    key={letter}
                                    id={`section-${letter}`}
                                    className="mb-10 scroll-mt-24"
                                >
                                    <h2 className="text-xl font-bold text-slate-700 mb-3">{letter}</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {list.map((w) => {
                                            const m = w.word_definition.meaning;

                                            return (
                                                <div
                                                    key={w.id}
                                                    className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
                                                >
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <h2 className="text-xl font-bold">{w.word}</h2>
                                                            <p className="text-slate-500 text-sm mt-1">
                                                                {w.word_definition.pronunciations
                                                                    ?.map((p) => p.ipa)
                                                                    .join(" • ")}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openEditModal(w)}
                                                                className="btn-icon"
                                                            >
                                                                <Edit3 className="w-5 h-5 text-brand" />
                                                            </button>
                                                            <button className="btn-icon">
                                                                <Trash2 className="w-5 h-5 text-red-500" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="mt-3">{m.definition}</p>
                                                    <p className="text-brand mt-1">→ {m.translation}</p>
                                                    <p className="italic text-slate-400 mt-1">"{m.example}"</p>

                                                    <div className="flex gap-2 mt-3">
                                                        {w.word_definition.pronunciations?.map((p, idx) => (
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
            </div>

            {/** RIGHT DRAWER — AI Auto Create */}
            <VocabAutoCreateSection
                show={showAutoCreate}
                onClose={() => setShowAutoCreate(false)}
            />

            {/* MODALS */}
            <VocabModal
                show={showCreateModal}
                mode="create"
                onClose={() => setShowCreateModal(false)}
                onSubmit={async (form) => {
                    const res = await api.createVocab(form);
                    if (res.success) {
                        setShowCreateModal(false);
                        loadWords();
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
                        loadWords();
                    }
                }}
            />
        </div>
    );
};

export default DictionaryPage;
