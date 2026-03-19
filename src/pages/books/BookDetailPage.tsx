import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Clock,
    Edit3,
    FileText,
    Globe,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { booksApi } from "../../api/books";
import { api } from "../../api/client";
import { BOOKS_QUERY_KEY } from "./BookListPage";
import { BookStatusBadge } from "../../components/books/BookStatusBadge";
import EditableSentenceRow from "../../components/books/EditableSentenceRow";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import PageHeader from "../../components/common/PageHeader";
import type {
    ContentSection,
    ContentSentence,
    ContentSource,
    SentenceMetadata,
} from "../../types/book";

const InsertBlockButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="flex items-center justify-center py-1 opacity-0 hover:opacity-100 transition-opacity">
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-brand border border-dashed border-slate-200 hover:border-brand/40 rounded-full hover:bg-brand/5 transition-all"
        >
            <Plus className="w-3 h-3" />
            Insert block
        </button>
    </div>
);

const BookDetailPage: React.FC = () => {
    const { sourceId } = useParams<{ sourceId: string }>();
    const queryClient = useQueryClient();

    const [book, setBook] = useState<ContentSource | null>(null);
    const [sections, setSections] = useState<ContentSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [sectionSentences, setSectionSentences] = useState<Record<number, ContentSentence[]>>({});
    const [loadingSentences, setLoadingSentences] = useState<Set<number>>(new Set());

    const [isEditingBook, setIsEditingBook] = useState(false);
    const [editBookDraft, setEditBookDraft] = useState({
        title: "",
        author: "",
        language: "",
    });
    const [savingBook, setSavingBook] = useState(false);

    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editSectionTitle, setEditSectionTitle] = useState("");
    const [savingSection, setSavingSection] = useState(false);

    const [addingBlock, setAddingBlock] = useState<{
        sectionId: number;
        afterSequence: number;
    } | null>(null);
    const [newBlockType, setNewBlockType] = useState<string>("text");
    const [newBlockText, setNewBlockText] = useState("");
    const [newBlockFile, setNewBlockFile] = useState<File | null>(null);
    const [newBlockCaption, setNewBlockCaption] = useState("");
    const [savingBlock, setSavingBlock] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!sourceId) return;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [bookData, sectionsData] = await Promise.all([
                    api.getContentSource(Number(sourceId)),
                    api.getContentSections(Number(sourceId)),
                ]);
                setBook(bookData);
                const sortedSections = sectionsData.sort((a, b) => a.sequence - b.sequence);
                setSections(sortedSections);

                // Auto-select first section and fetch its sentences
                if (sortedSections.length > 0) {
                    const firstSectionId = sortedSections[0].id;
                    setSelectedSectionId(firstSectionId);
                    setLoadingSentences((prev) => new Set(prev).add(firstSectionId));
                    try {
                        const sentences = await api.getSectionSentences(firstSectionId);
                        setSectionSentences((prev) => ({ ...prev, [firstSectionId]: sentences }));
                    } catch {
                        // Keep empty
                    } finally {
                        setLoadingSentences((prev) => {
                            const s = new Set(prev);
                            s.delete(firstSectionId);
                            return s;
                        });
                    }
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load book details.");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [sourceId]);

    const handleSelectSection = async (sectionId: number) => {
        setSelectedSectionId(sectionId);

        if (!sectionSentences[sectionId]) {
            setLoadingSentences((prev) => new Set(prev).add(sectionId));
            try {
                const sentences = await api.getSectionSentences(sectionId);
                setSectionSentences((prev) => ({ ...prev, [sectionId]: sentences }));
            } catch {
                // Keep empty
            } finally {
                setLoadingSentences((prev) => {
                    const s = new Set(prev);
                    s.delete(sectionId);
                    return s;
                });
            }
        }
    };

    const navigate = useNavigate();

    const handleAction = async (action: string) => {
        if (action === "Delete") {
            if (!book) return;
            setIsDeleteDialogOpen(true);
            return;
        }
        if (action === "Edit") {
            if (!book) return;
            setEditBookDraft({
                title: book.title || "",
                author: book.author || "",
                language: book.language || "",
            });
            setIsEditingBook(true);
            return;
        }
        alert(`${action} action is not implemented yet.`);
    };

    const handleSaveBook = async () => {
        if (!book || !editBookDraft.title.trim()) return;
        setSavingBook(true);
        try {
            const updated = await booksApi.updateSource(book.id, {
                title: editBookDraft.title.trim(),
                author: editBookDraft.author.trim() || undefined,
                language: editBookDraft.language.trim() || undefined,
            });
            setBook(updated);
            setIsEditingBook(false);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to update book.");
        } finally {
            setSavingBook(false);
        }
    };

    const handleCreateSection = async () => {
        if (!book) return;
        const title = prompt("Enter chapter title:");
        if (!title?.trim()) return;
        try {
            const newSection = await booksApi.createSection(book.id, {
                title: title.trim(),
            });
            setSections((prev) => [...prev, newSection].sort((a, b) => a.sequence - b.sequence));
            setBook((prev) =>
                prev
                    ? {
                          ...prev,
                          totalSections: (prev.totalSections || 0) + 1,
                      }
                    : prev,
            );
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to create chapter.");
        }
    };

    const handleSaveSectionTitle = async (sectionId: number) => {
        if (!editSectionTitle.trim()) return;
        setSavingSection(true);
        try {
            const updated = await booksApi.updateSection(sectionId, {
                title: editSectionTitle.trim(),
            });
            setSections((prev) =>
                prev.map((s) => (s.id === sectionId ? { ...s, title: updated.title } : s)),
            );
            setEditingSectionId(null);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to update chapter.");
        } finally {
            setSavingSection(false);
        }
    };

    const handleDeleteSection = async (sectionId: number) => {
        const section = sections.find((s) => s.id === sectionId);
        if (
            !confirm(
                `Delete chapter "${section?.title || "Untitled"}"? This will delete all its sentences.`,
            )
        )
            return;
        try {
            await booksApi.deleteSection(sectionId);
            setSections((prev) => prev.filter((s) => s.id !== sectionId));
            if (selectedSectionId === sectionId) {
                setSelectedSectionId(null);
            }
            setBook((prev) =>
                prev
                    ? {
                          ...prev,
                          totalSections: Math.max(0, (prev.totalSections || 0) - 1),
                      }
                    : prev,
            );
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to delete chapter.");
        }
    };

    const handleInsertBlock = async () => {
        if (!addingBlock) return;

        const isImage = newBlockType === "image";
        if (isImage && !newBlockFile && !newBlockText.trim()) return;
        if (!isImage && !newBlockText.trim()) return;

        setSavingBlock(true);
        try {
            let text = newBlockText.trim();
            if (isImage && newBlockFile) {
                text = await booksApi.uploadContentImage(newBlockFile);
            }

            const metadata: SentenceMetadata | null = isImage
                ? ({
                      translation: null,
                      contains_latex: null,
                      words: [],
                      caption: newBlockCaption.trim() || null,
                  } as SentenceMetadata)
                : newBlockType === "heading"
                  ? ({
                        translation: null,
                        contains_latex: null,
                        words: [],
                        heading_level: 2,
                    } as SentenceMetadata)
                  : null;

            await booksApi.createSentence(addingBlock.sectionId, {
                text,
                sequence: addingBlock.afterSequence + 1,
                block_type: newBlockType,
                metadata,
            });
            const sentences = await booksApi.getSectionSentences(addingBlock.sectionId);
            setSectionSentences((prev) => ({
                ...prev,
                [addingBlock.sectionId]: sentences,
            }));
            setAddingBlock(null);
            setNewBlockText("");
            setNewBlockFile(null);
            setNewBlockCaption("");
            setNewBlockType("text");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to insert block.");
        } finally {
            setSavingBlock(false);
        }
    };

    const handleDeleteSentence = async (sentenceId: number, sectionId: number) => {
        if (!confirm("Delete this content block?")) return;
        try {
            await booksApi.deleteSentence(sentenceId);
            setSectionSentences((prev) => ({
                ...prev,
                [sectionId]: (prev[sectionId] || []).filter((s) => s.id !== sentenceId),
            }));
            setBook((prev) =>
                prev
                    ? {
                          ...prev,
                          totalSentences: Math.max(0, (prev.totalSentences || 0) - 1),
                      }
                    : prev,
            );
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to delete block.");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!book) return;
        setIsDeleting(true);
        try {
            await booksApi.deleteContentSource(book.id);
            queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
            navigate("/admin/books");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to delete book.");
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading book details…
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
                <p className="text-slate-900 font-medium mb-1">Failed to load book</p>
                <p className="text-sm mb-4">{error || "Book not found."}</p>
                <Link to="/admin/books" className="text-brand hover:underline font-medium text-sm">
                    Back to Book Library
                </Link>
            </div>
        );
    }

    const selectedSection = sections.find((s) => s.id === selectedSectionId);
    const sentences = selectedSectionId ? sectionSentences[selectedSectionId] : undefined;
    const isLoadingSentences = selectedSectionId ? loadingSentences.has(selectedSectionId) : false;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50/50">
            {/* Header top area */}
            <div className="px-8 py-6 pb-0 max-w-[1600px] w-full mx-auto">
                <PageHeader
                    badge={
                        <Link
                            to="/admin/books"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Library
                        </Link>
                    }
                    title={book.title || "Untitled Book"}
                    titleAddon={<BookStatusBadge status={book.status} />}
                    description={book.author ? `by ${book.author}` : undefined}
                />
            </div>

            {/* Main content grid */}
            <div className="flex-1 px-8 py-6 max-w-[1600px] w-full mx-auto flex flex-col min-h-0">
                {/* Book Meta & Quick Actions Panel */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-0.5">
                                Language
                            </span>
                            <span className="font-semibold text-slate-900">
                                {book.language || "Unknown"}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-0.5">
                                Chapters
                            </span>
                            <span className="font-semibold text-slate-900">
                                {book.totalSections}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-0.5">
                                Sentences
                            </span>
                            <span className="font-semibold text-slate-900">
                                {book.totalSentences.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-0.5">
                                Created
                            </span>
                            <span className="font-medium text-slate-700">
                                {new Date(book.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 xl:pl-4">
                        <button
                            type="button"
                            onClick={() => handleAction("Edit")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-colors shadow-sm"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction("Publish")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand border border-transparent rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-colors shadow-sm"
                        >
                            <Globe className="w-4 h-4 text-white/80" />
                            Publish
                        </button>
                        <span className="w-px h-6 bg-slate-200 mx-1"></span>
                        <button
                            type="button"
                            onClick={() => handleAction("Reprocess")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reprocess
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction("Delete")}
                            className="inline-flex items-center justify-center p-1.5 text-rose-600 bg-white border border-slate-300 rounded-lg hover:bg-rose-50 hover:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors shadow-sm ml-1"
                            title="Delete Book"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Split Pane: Sidebar + Content */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar: Chapters */}
                    <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm shrink-0 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-brand" />
                                Chapters
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {sections.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCreateSection}
                                    className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-brand transition-colors"
                                    title="Add chapter"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                            {sections.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    No chapters found.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {sections.map((section) => {
                                        const isSelected = selectedSectionId === section.id;
                                        const isEditingTitle = editingSectionId === section.id;
                                        return (
                                            <div
                                                key={section.id}
                                                className="relative group/chapter"
                                            >
                                                {isEditingTitle ? (
                                                    <div className="px-3 py-2.5 rounded-lg border border-brand/30 bg-brand/5">
                                                        <input
                                                            type="text"
                                                            value={editSectionTitle}
                                                            onChange={(e) =>
                                                                setEditSectionTitle(e.target.value)
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter")
                                                                    handleSaveSectionTitle(
                                                                        section.id,
                                                                    );
                                                                if (e.key === "Escape")
                                                                    setEditingSectionId(null);
                                                            }}
                                                            className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-brand/40"
                                                            autoFocus
                                                            disabled={savingSection}
                                                        />
                                                        <div className="flex gap-1 mt-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleSaveSectionTitle(
                                                                        section.id,
                                                                    )
                                                                }
                                                                disabled={savingSection}
                                                                className="text-xs px-2 py-0.5 bg-brand text-white rounded hover:bg-brand-600 disabled:opacity-60"
                                                            >
                                                                {savingSection ? "..." : "Save"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setEditingSectionId(null)
                                                                }
                                                                disabled={savingSection}
                                                                className="text-xs px-2 py-0.5 text-slate-500 hover:text-slate-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelectSection(section.id)
                                                        }
                                                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start gap-3 group ${
                                                            isSelected
                                                                ? "bg-brand/5 border border-brand/20 shadow-sm"
                                                                : "hover:bg-slate-50 border border-transparent"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                                                                isSelected
                                                                    ? "bg-brand text-white"
                                                                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                                            }`}
                                                        >
                                                            {section.sequence}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className={`text-sm font-medium truncate ${isSelected ? "text-brand-700" : "text-slate-700"}`}
                                                            >
                                                                {section.title || "Untitled"}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                                <span>
                                                                    {section.sentenceCount} sent.
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                <span
                                                                    className={
                                                                        section.status ===
                                                                        "COMPLETE"
                                                                            ? "text-emerald-600"
                                                                            : "text-amber-600"
                                                                    }
                                                                >
                                                                    {section.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )}
                                                {!isEditingTitle && (
                                                    <div className="absolute top-2 right-2 hidden group-hover/chapter:flex items-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingSectionId(section.id);
                                                                setEditSectionTitle(
                                                                    section.title || "",
                                                                );
                                                            }}
                                                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                                                            title="Edit chapter title"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteSection(section.id);
                                                            }}
                                                            className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                                                            title="Delete chapter"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Content: Sentences */}
                    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm min-h-0 overflow-hidden">
                        {selectedSection ? (
                            <>
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900">
                                            {selectedSection.sequence}.{" "}
                                            {selectedSection.title || "Untitled Section"}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" />
                                                {selectedSection.sentenceCount} sentences
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {selectedSection.status === "COMPLETE" ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                ) : (
                                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                )}
                                                {selectedSection.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-white p-6 scrollbar-thin scrollbar-thumb-slate-200">
                                    {isLoadingSentences ? (
                                        <div className="flex items-center justify-center p-12 text-slate-500">
                                            <Loader2 className="w-6 h-6 animate-spin mr-3 text-brand" />
                                            <span>Loading sentences…</span>
                                        </div>
                                    ) : sentences && sentences.length > 0 ? (
                                        <div className="max-w-3xl space-y-1">
                                            {/* Insert block at beginning */}
                                            <InsertBlockButton
                                                onClick={() => {
                                                    setAddingBlock({
                                                        sectionId: selectedSectionId!,
                                                        afterSequence: 0,
                                                    });
                                                    setNewBlockType("text");
                                                    setNewBlockText("");
                                                }}
                                            />
                                            {sentences.map((s) => (
                                                <div key={s.id}>
                                                    <div className="group/sentence relative py-2">
                                                        <EditableSentenceRow
                                                            sentence={s}
                                                            onSaved={(updated) => {
                                                                setSectionSentences((prev) => ({
                                                                    ...prev,
                                                                    [selectedSectionId!]: prev[
                                                                        selectedSectionId!
                                                                    ].map((sent) =>
                                                                        sent.id === updated.id
                                                                            ? updated
                                                                            : sent,
                                                                    ),
                                                                }));
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteSentence(
                                                                    s.id,
                                                                    selectedSectionId!,
                                                                )
                                                            }
                                                            className="absolute top-2 right-0 hidden group-hover/sentence:flex p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                                                            title="Delete block"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    {/* Insert block after each sentence */}
                                                    <InsertBlockButton
                                                        onClick={() => {
                                                            setAddingBlock({
                                                                sectionId: selectedSectionId!,
                                                                afterSequence: s.sequence,
                                                            });
                                                            setNewBlockType("text");
                                                            setNewBlockText("");
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                            <FileText className="w-10 h-10 mb-3 text-slate-300" />
                                            <p>No sentences found in this section.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                                <BookOpen className="w-12 h-12 mb-4 text-slate-200" />
                                <p className="text-lg font-medium text-slate-600">
                                    Select a chapter
                                </p>
                                <p className="text-sm">
                                    Choose a chapter from the sidebar to view its sentences
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {addingBlock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            Insert Content Block
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Block Type
                                </label>
                                <select
                                    value={newBlockType}
                                    onChange={(e) => setNewBlockType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                                >
                                    <option value="text">Text</option>
                                    <option value="heading">Heading</option>
                                    <option value="image">Image</option>
                                    <option value="quote">Quote</option>
                                </select>
                            </div>
                            {newBlockType === "image" ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Image File
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0] ?? null;
                                                setNewBlockFile(f);
                                                if (f) setNewBlockText("");
                                            }}
                                            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                                        />
                                        {newBlockFile && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {newBlockFile.name} (
                                                {(newBlockFile.size / 1024).toFixed(0)} KB)
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Or paste image URL
                                        </label>
                                        <input
                                            type="text"
                                            value={newBlockText}
                                            onChange={(e) => {
                                                setNewBlockText(e.target.value);
                                                if (e.target.value) {
                                                    setNewBlockFile(null);
                                                    if (fileInputRef.current)
                                                        fileInputRef.current.value = "";
                                                }
                                            }}
                                            placeholder="https://..."
                                            disabled={!!newBlockFile}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:bg-slate-50 disabled:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Caption (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={newBlockCaption}
                                            onChange={(e) => setNewBlockCaption(e.target.value)}
                                            placeholder="Describe this image..."
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Content
                                    </label>
                                    <textarea
                                        value={newBlockText}
                                        onChange={(e) => setNewBlockText(e.target.value)}
                                        rows={3}
                                        placeholder={
                                            newBlockType === "heading"
                                                ? "Enter heading text..."
                                                : "Enter text content..."
                                        }
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-y"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setAddingBlock(null);
                                    setNewBlockText("");
                                    setNewBlockFile(null);
                                    setNewBlockCaption("");
                                    setNewBlockType("text");
                                }}
                                disabled={savingBlock}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleInsertBlock}
                                disabled={
                                    savingBlock ||
                                    (newBlockType === "image"
                                        ? !newBlockFile && !newBlockText.trim()
                                        : !newBlockText.trim())
                                }
                                className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-600 disabled:opacity-60"
                            >
                                {savingBlock ? "Inserting..." : "Insert"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditingBook && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Book</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editBookDraft.title}
                                    onChange={(e) =>
                                        setEditBookDraft((d) => ({
                                            ...d,
                                            title: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Author
                                </label>
                                <input
                                    type="text"
                                    value={editBookDraft.author}
                                    onChange={(e) =>
                                        setEditBookDraft((d) => ({
                                            ...d,
                                            author: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Language
                                </label>
                                <input
                                    type="text"
                                    value={editBookDraft.language}
                                    onChange={(e) =>
                                        setEditBookDraft((d) => ({
                                            ...d,
                                            language: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                type="button"
                                onClick={() => setIsEditingBook(false)}
                                disabled={savingBook}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveBook}
                                disabled={savingBook || !editBookDraft.title.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-600 disabled:opacity-60"
                            >
                                {savingBook ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {book && (
                <ConfirmModal
                    isOpen={isDeleteDialogOpen}
                    onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Book"
                    description={
                        <>
                            Are you sure you want to delete <strong>{book.title}</strong>? This
                            action cannot be undone.
                        </>
                    }
                    confirmText="Delete Book"
                    isDestructive={true}
                    isConfirming={isDeleting}
                />
            )}
        </div>
    );
};

export default BookDetailPage;
