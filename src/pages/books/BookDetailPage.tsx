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
    RefreshCw,
    Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { booksApi } from "../../api/books";
import { api } from "../../api/client";
import { BookStatusBadge } from "../../components/books/BookStatusBadge";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import PageHeader from "../../components/common/PageHeader";
import type { ContentSection, ContentSentence, ContentSource } from "../../types/book";

const BookDetailPage: React.FC = () => {
    const { sourceId } = useParams<{ sourceId: string }>();

    const [book, setBook] = useState<ContentSource | null>(null);
    const [sections, setSections] = useState<ContentSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [sectionSentences, setSectionSentences] = useState<Record<number, ContentSentence[]>>({});
    const [loadingSentences, setLoadingSentences] = useState<Set<number>>(new Set());

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
        alert(`${action} action is not implemented yet.`);
    };

    const handleDeleteConfirm = async () => {
        if (!book) return;
        setIsDeleting(true);
        try {
            await booksApi.deleteContentSource(book.id);
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
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {sections.length}
                            </span>
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
                                        return (
                                            <button
                                                type="button"
                                                key={section.id}
                                                onClick={() => handleSelectSection(section.id)}
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
                                                        <span>{section.sentenceCount} sent.</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span
                                                            className={
                                                                section.status === "COMPLETE"
                                                                    ? "text-emerald-600"
                                                                    : "text-amber-600"
                                                            }
                                                        >
                                                            {section.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
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
                                        <div className="max-w-3xl space-y-5">
                                            {sentences.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className="group flex gap-4 p-3 -mx-3 rounded-xl hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="w-8 shrink-0 flex justify-end">
                                                        <span className="text-[11px] font-mono text-slate-300 group-hover:text-brand-400 font-medium pt-1 transition-colors">
                                                            {String(s.sequence).padStart(3, "0")}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-[15px] leading-relaxed text-slate-700 font-medium tracking-wide">
                                                            {s.text}
                                                        </p>
                                                        {s.tokenCount > 0 && (
                                                            <p className="text-[11px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                                                tokens: {s.tokenCount}
                                                            </p>
                                                        )}
                                                    </div>
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
