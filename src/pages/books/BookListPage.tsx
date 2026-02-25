import { Library, Loader2, PlusCircle, RefreshCcw, Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { BookStatusBadge } from "../../components/books/BookStatusBadge";
import PageHeader from "../../components/common/PageHeader";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";
import type { ContentSource } from "../../types/book";

type StatusFilter = "ALL" | ContentSource["status"];

const statusFilters: StatusFilter[] = ["ALL", "PROCESSING", "READY", "DRAFT"];

const BookListPage: React.FC = () => {
    const [books, setBooks] = useState<ContentSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [search, setSearch] = useState("");

    const loadBooks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = await api.getContentSources();
            setBooks(payload.content ?? []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load books.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadBooks();
    }, [loadBooks]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadBooks();
        setRefreshing(false);
    };

    const filteredBooks = useMemo(() => {
        const term = search.trim().toLowerCase();
        return books.filter((book) => {
            const matchesStatus = statusFilter === "ALL" || book.status === statusFilter;
            const matchesSearch =
                !term ||
                book.title?.toLowerCase().includes(term) ||
                book.author?.toLowerCase().includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [books, search, statusFilter]);

    const summaryStats = useMemo(
        () => [
            { label: "Total books", value: books.length },
            {
                label: "Processing",
                value: books.filter((b) => b.status === "PROCESSING").length,
            },
            {
                label: "Ready",
                value: books.filter((b) => b.status === "READY").length,
            },
            {
                label: "Draft",
                value: books.filter((b) => b.status === "DRAFT").length,
            },
        ],
        [books],
    );

    return (
        <div className="relative overflow-hidden px-8 py-6">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -left-28 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
                <div className="absolute top-20 right-[-90px] h-80 w-80 rounded-full bg-gradient-to-br from-brand/25 via-brand/10 to-transparent blur-3xl" />
            </div>

            <div className="space-y-8 relative">
                <PageHeader
                    badge={
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            Book Library
                        </div>
                    }
                    title="Book Library"
                    description="Upload PDFs, monitor ingestion progress, and browse ingested book content."
                    actions={
                        <>
                            <Btn.HeroSecondary onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCcw
                                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Btn.HeroSecondary>

                            <Link to="/admin/books/upload" className="w-full sm:w-auto">
                                <Btn.HeroPrimary className="w-full sm:w-auto">
                                    <PlusCircle className="w-4 h-4" />
                                    Upload Book
                                </Btn.HeroPrimary>
                            </Link>
                        </>
                    }
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {summaryStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur"
                            >
                                <div className="text-[11px] uppercase tracking-wide text-white/70">
                                    {stat.label}
                                </div>
                                <div className="text-2xl font-semibold">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </PageHeader>

                {/* Filters */}
                <div className="bg-gradient-to-br from-white via-white to-brand/5 rounded-card shadow-card border border-slate-100 p-5 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <Search className="w-4 h-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title or author"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {statusFilters.map((status) => (
                                <button
                                    type="button"
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-medium border
                                        ${
                                            statusFilter === status
                                                ? "bg-brand text-white border-brand"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    {status === "ALL" ? "All" : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Books Table */}
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Library className="w-4 h-4 text-slate-500" />
                            <h2 className="text-base font-semibold text-slate-900">Books</h2>
                            <span className="text-xs text-slate-500">({filteredBooks.length})</span>
                        </div>
                    </div>

                    {error && (
                        <div className="px-5 py-3 text-sm text-rose-600 bg-rose-50 border-t border-rose-100">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="px-5 py-10 flex items-center justify-center gap-2 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading books…
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="px-5 py-12 text-center text-slate-500">
                            No books found. Try adjusting your filters or upload a new book.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-slate-500 uppercase text-xs tracking-wide">
                                    <tr>
                                        <th className="px-5 py-3">Title</th>
                                        <th className="px-5 py-3">Author</th>
                                        <th className="px-5 py-3">Chapters</th>
                                        <th className="px-5 py-3">Sentences</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Created</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredBooks.map((book) => (
                                        <tr key={book.id} className="hover:bg-slate-50/60">
                                            <td className="px-5 py-3">
                                                <div className="font-semibold text-slate-900">
                                                    {book.title || "Untitled"}
                                                </div>
                                                <div className="text-[12px] text-slate-500">
                                                    ID {book.id} · {book.sourceType}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">
                                                {book.author || "—"}
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">
                                                {book.totalSections}
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">
                                                {book.totalSentences}
                                            </td>
                                            <td className="px-5 py-3">
                                                <BookStatusBadge status={book.status} />
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">
                                                {new Date(book.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Link
                                                    to={`/admin/books/${book.id}`}
                                                    className="text-brand font-semibold hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookListPage;
