import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, FileText, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { BookStatusBadge } from "../../components/books/BookStatusBadge";
import PageHeader from "../../components/common/PageHeader";
import type { ContentSection, ContentSentence, ContentSource } from "../../types/book";

const BookDetailPage: React.FC = () => {
    const { sourceId } = useParams<{ sourceId: string }>();

    const [book, setBook] = useState<ContentSource | null>(null);
    const [sections, setSections] = useState<ContentSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
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
                setSections(sectionsData);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load book details.");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [sourceId]);

    const toggleSection = async (sectionId: number) => {
        const next = new Set(expandedSections);

        if (next.has(sectionId)) {
            next.delete(sectionId);
            setExpandedSections(next);
            return;
        }

        next.add(sectionId);
        setExpandedSections(next);

        if (!sectionSentences[sectionId]) {
            setLoadingSentences((prev) => new Set(prev).add(sectionId));
            try {
                const sentences = await api.getSectionSentences(sectionId);
                setSectionSentences((prev) => ({ ...prev, [sectionId]: sentences }));
            } catch {
                // Keep section expanded but empty
            } finally {
                setLoadingSentences((prev) => {
                    const s = new Set(prev);
                    s.delete(sectionId);
                    return s;
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="px-8 py-20 flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading book details…
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="px-8 py-20 text-center">
                <p className="text-rose-600 mb-4">{error || "Book not found."}</p>
                <Link to="/admin/books" className="text-brand hover:underline">
                    Back to Book Library
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 px-8 py-6">
            <PageHeader
                badge={
                    <Link
                        to="/admin/books"
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85 border border-white/15 hover:bg-white/15"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Book Library
                    </Link>
                }
                title={book.title || "Untitled Book"}
                titleAddon={<BookStatusBadge status={book.status} />}
                description={book.author ? `by ${book.author}` : undefined}
            />

            {/* Info card */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Language", value: book.language || "—" },
                    { label: "Chapters", value: book.totalSections },
                    { label: "Sentences", value: book.totalSentences },
                    {
                        label: "Created",
                        value: new Date(book.createdAt).toLocaleDateString(),
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="bg-white rounded-card shadow-card border border-slate-100 px-5 py-4"
                    >
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                            {item.label}
                        </div>
                        <div className="text-xl font-semibold text-slate-900 mt-1">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Chapters list */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <h2 className="text-base font-semibold text-slate-900">Chapters</h2>
                    <span className="text-xs text-slate-500">({sections.length})</span>
                </div>

                {sections.length === 0 ? (
                    <div className="px-5 py-12 text-center text-slate-500">
                        No chapters found. The book may still be processing.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sections
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((section) => {
                                const isExpanded = expandedSections.has(section.id);
                                const sentences = sectionSentences[section.id];
                                const isLoadingSentences = loadingSentences.has(section.id);

                                return (
                                    <div key={section.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(section.id)}
                                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 text-left"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-900 text-sm truncate">
                                                    {section.sequence}.{" "}
                                                    {section.title || "Untitled Section"}
                                                </div>
                                                <div className="text-[12px] text-slate-500">
                                                    {section.sentenceCount} sentences ·{" "}
                                                    {section.sectionType} · {section.status}
                                                </div>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3">
                                                {isLoadingSentences ? (
                                                    <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Loading sentences…
                                                    </div>
                                                ) : sentences && sentences.length > 0 ? (
                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                        {sentences.map((s) => (
                                                            <div
                                                                key={s.id}
                                                                className="flex gap-3 text-sm"
                                                            >
                                                                <span className="text-slate-400 font-mono text-xs shrink-0 pt-0.5">
                                                                    {s.sequence}
                                                                </span>
                                                                <span className="text-slate-700">
                                                                    {s.text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                                                        <FileText className="w-4 h-4" />
                                                        No sentences in this section.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookDetailPage;
