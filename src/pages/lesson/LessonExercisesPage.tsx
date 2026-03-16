// src/pages/lesson/LessonExercisesPage.tsx

import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Edit,
    Loader2,
    MessageSquareText,
    Plus,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import {
    useApproveQuestion,
    useComprehensionQuestions,
    useEditQuestion,
    useGenerateComprehensionQuestions,
    useRejectQuestion,
} from "../../hooks/useComprehensionQuestions";
import type {
    ComprehensionQuestion,
    EditQuestionRequest,
} from "../../types/comprehension";
import type { LessonOutletContext } from "../LessonViewPage";

const PAGE_SIZE = 20;

type StatusTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function statusBadge(status: string) {
    switch (status) {
        case "APPROVED":
            return (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Approved
                </span>
            );
        case "REJECTED":
            return (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                    Rejected
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    Pending
                </span>
            );
    }
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimestamp(seconds: number | null): string {
    if (seconds == null) return "\u2014";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseDistractors(raw: string): string[] {
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return raw ? [raw] : [];
    }
}

const LessonExercisesPage = () => {
    const { lessonId: lessonIdParam } = useParams<{ lessonId: string }>();
    const { lessonMeta } = useOutletContext<LessonOutletContext>();
    const lessonId = lessonIdParam ? Number(lessonIdParam) : undefined;

    const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
    const [page, setPage] = useState(0);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] =
        useState<ComprehensionQuestion | null>(null);
    const [editForm, setEditForm] = useState<EditQuestionRequest>({});
    const [editDistractors, setEditDistractors] = useState<string[]>([]);
    const [editError, setEditError] = useState<string | null>(null);

    // Generate modal
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [generateCount, setGenerateCount] = useState(5);
    const [generateDifficulty, setGenerateDifficulty] = useState("B1");
    const [generateError, setGenerateError] = useState<string | null>(null);

    // Reset expanded row on page/tab change
    useEffect(() => {
        setExpandedId(null);
    }, [page, activeTab]);

    const { data, isLoading } = useComprehensionQuestions({
        lessonId,
        status: activeTab === "ALL" ? undefined : activeTab,
        page,
        size: PAGE_SIZE,
    });

    const approveMutation = useApproveQuestion();
    const rejectMutation = useRejectQuestion();
    const editMutation = useEditQuestion();
    const generateMutation = useGenerateComprehensionQuestions();

    const questions = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const pendingCount = useMemo(
        () =>
            questions.filter((q) => q.approvalStatus === "PENDING").length,
        [questions],
    );

    const isTrulyEmpty = questions.length === 0 && activeTab === "ALL";
    const isFilterEmpty = questions.length === 0 && activeTab !== "ALL";
    const hasQuestions = total > 0 || activeTab !== "ALL";

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const openEditModal = (question: ComprehensionQuestion) => {
        setEditingQuestion(question);
        setEditForm({
            question_text: question.questionText,
            correct_answer: question.correctAnswer,
            explanation: question.explanation ?? "",
        });
        setEditDistractors(parseDistractors(question.distractors));
        setEditError(null);
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingQuestion) return;
        setEditError(null);
        try {
            const filtered = editDistractors.filter((d) => d.trim() !== "");
            await editMutation.mutateAsync({
                id: editingQuestion.id,
                data: { ...editForm, distractors: JSON.stringify(filtered) },
            });
            setEditModalOpen(false);
            setEditingQuestion(null);
        } catch (e) {
            setEditError(
                e instanceof Error ? e.message : "Failed to save changes.",
            );
        }
    };

    const openGenerateModal = () => {
        setGenerateCount(5);
        setGenerateDifficulty(lessonMeta?.level ?? "B1");
        setGenerateError(null);
        setGenerateModalOpen(true);
    };

    const handleGenerate = async () => {
        if (!lessonId) {
            setGenerateError("Lesson ID is missing.");
            return;
        }
        setGenerateError(null);
        try {
            await generateMutation.mutateAsync({
                lessonId,
                data: {
                    question_count: generateCount,
                    difficulty: generateDifficulty,
                },
            });
            setGenerateModalOpen(false);
        } catch (e) {
            setGenerateError(
                e instanceof Error
                    ? e.message
                    : "Failed to generate questions.",
            );
        }
    };

    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Comprehension Questions
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{total} total</span>
                        {pendingCount > 0 && (
                            <>
                                <span className="text-slate-300">&middot;</span>
                                <span className="text-amber-600">
                                    {pendingCount} pending review
                                </span>
                            </>
                        )}
                    </p>
                </div>
                {hasQuestions && (
                    <Btn.Primary onClick={openGenerateModal}>
                        <Sparkles className="w-4 h-4" />
                        Generate
                    </Btn.Primary>
                )}
            </div>

            {/* TABS */}
            {hasQuestions && (
                <div className="flex items-center gap-0 border-b border-slate-100">
                    {(
                        [
                            { label: "All", value: "ALL" as StatusTab },
                            { label: "Pending", value: "PENDING" as StatusTab },
                            { label: "Approved", value: "APPROVED" as StatusTab },
                            { label: "Rejected", value: "REJECTED" as StatusTab },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setActiveTab(tab.value);
                                setPage(0);
                            }}
                            className={`px-3 py-2 text-xs font-medium border-b-2 transition ${
                                activeTab === tab.value
                                    ? "text-brand border-brand"
                                    : "text-slate-400 border-transparent hover:text-slate-600"
                            }`}
                        >
                            {tab.label}
                            {tab.value === "PENDING" && pendingCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold leading-none">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* CONTENT */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={`skeleton-${i}`} className="h-10 w-full" />
                        ))}
                    </div>
                ) : isTrulyEmpty ? (
                    <div className="text-center py-16 space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                            <MessageSquareText className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-slate-700 text-sm">
                            No comprehension questions yet
                        </p>
                        <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                            Generate MCQ questions from the lesson transcript using AI.
                        </p>
                        <div className="pt-2">
                            <Btn.Primary onClick={openGenerateModal}>
                                <Sparkles className="w-4 h-4" />
                                Generate Questions
                            </Btn.Primary>
                        </div>
                    </div>
                ) : isFilterEmpty ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-slate-400">
                            No {activeTab.toLowerCase()} questions.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                                    <th className="pl-4 pr-1 py-2.5 font-medium w-[28px]" />
                                    <th className="px-2 py-2.5 font-medium w-[44px]">#</th>
                                    <th className="px-4 py-2.5 font-medium">Question</th>
                                    <th className="px-4 py-2.5 font-medium">Answer</th>
                                    <th className="px-4 py-2.5 font-medium w-[80px]">Status</th>
                                    <th className="px-4 py-2.5 font-medium w-[80px]">Created</th>
                                    <th className="px-4 py-2.5 font-medium w-[90px]" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {questions.map((q) => {
                                    const isExpanded = expandedId === q.id;
                                    const distractors = parseDistractors(q.distractors);

                                    return (
                                        <Fragment key={q.id}>
                                            {/* Summary row */}
                                            <tr
                                                onClick={() => toggleExpand(q.id)}
                                                className={`group cursor-pointer transition-colors ${
                                                    isExpanded
                                                        ? "bg-slate-50/80"
                                                        : "hover:bg-slate-50/60"
                                                }`}
                                            >
                                                <td className="pl-4 pr-1 py-2.5 text-slate-400">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    )}
                                                </td>
                                                <td className="px-2 py-2.5 text-slate-400 font-mono text-xs">
                                                    {q.id}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <p
                                                        className="text-slate-800 text-sm line-clamp-1"
                                                        title={q.questionText}
                                                    >
                                                        {q.questionText}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600 text-sm max-w-[180px]">
                                                    <span className="truncate block">
                                                        {q.correctAnswer}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {statusBadge(q.approvalStatus)}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                                                    {formatDate(q.createdAt)}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div
                                                        className={`flex items-center justify-end gap-0.5 transition-opacity duration-150 ${
                                                            isExpanded
                                                                ? "opacity-0 pointer-events-none"
                                                                : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                                                        }`}
                                                    >
                                                        {q.approvalStatus !== "APPROVED" && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    approveMutation.mutate(q.id);
                                                                }}
                                                                disabled={approveMutation.isPending}
                                                                className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {q.approvalStatus !== "REJECTED" && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    rejectMutation.mutate(q.id);
                                                                }}
                                                                disabled={rejectMutation.isPending}
                                                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditModal(q);
                                                            }}
                                                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded detail panel */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="px-4 pb-4 pt-0 bg-slate-50/80">
                                                        <div className="ml-7 p-4 bg-white border border-slate-100 rounded-xl space-y-4">
                                                            {/* Question */}
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                                                                    Question
                                                                </p>
                                                                <p className="text-sm text-slate-800 leading-relaxed">
                                                                    {q.questionText}
                                                                </p>
                                                            </div>

                                                            {/* Answer + Distractors */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                                                                        Correct Answer
                                                                    </p>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                                        <span className="text-sm font-medium text-emerald-700">
                                                                            {q.correctAnswer}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                                                                        Distractors
                                                                    </p>
                                                                    {distractors.length > 0 ? (
                                                                        <ul className="space-y-1">
                                                                            {distractors.map((d, i) => (
                                                                                <li
                                                                                    key={`${q.id}-d-${i}`}
                                                                                    className="flex items-center gap-1.5 text-sm text-slate-600"
                                                                                >
                                                                                    <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                                                                                    {d}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400 italic">
                                                                            No distractors
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Explanation */}
                                                            {q.explanation && (
                                                                <div>
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                                                                        Explanation
                                                                    </p>
                                                                    <p className="text-sm text-slate-600 leading-relaxed">
                                                                        {q.explanation}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Audio timestamps */}
                                                            {(q.audioStartTime != null || q.audioEndTime != null) && (
                                                                <div>
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                                                                        Audio Range
                                                                    </p>
                                                                    <span className="text-sm text-slate-600 font-mono">
                                                                        {formatTimestamp(q.audioStartTime)} &mdash; {formatTimestamp(q.audioEndTime)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Actions */}
                                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                                                                {q.approvalStatus !== "APPROVED" && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            approveMutation.mutate(q.id);
                                                                        }}
                                                                        disabled={approveMutation.isPending}
                                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition disabled:opacity-50"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                )}
                                                                {q.approvalStatus !== "REJECTED" && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            rejectMutation.mutate(q.id);
                                                                        }}
                                                                        disabled={rejectMutation.isPending}
                                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition disabled:opacity-50"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditModal(q);
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {totalPages > 1 && questions.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-50">
                        <p className="text-xs text-slate-400">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-40"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {editModalOpen && editingQuestion && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-2xl shadow-shell w-full max-w-lg p-6 border border-slate-100 animate-slideIn">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Edit className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Question
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Edit #{editingQuestion.id}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setEditModalOpen(false);
                                    setEditingQuestion(null);
                                }}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-5 text-sm">
                            {editError && (
                                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                                    {editError}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Question Text
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={3}
                                    value={editForm.question_text ?? ""}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            question_text: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Correct Answer
                                </label>
                                <Input
                                    value={editForm.correct_answer ?? ""}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            correct_answer: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                    Distractors (wrong answers)
                                </label>
                                <div className="space-y-2">
                                    {editDistractors.map((d, i) => (
                                        <div key={`distractor-${i}`} className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 w-4 text-center flex-shrink-0">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <Input
                                                value={d}
                                                onChange={(e) => {
                                                    const updated = [...editDistractors];
                                                    updated[i] = e.target.value;
                                                    setEditDistractors(updated);
                                                }}
                                                placeholder={`Distractor ${i + 1}`}
                                            />
                                            {editDistractors.length > 1 && (
                                                <button
                                                    onClick={() =>
                                                        setEditDistractors((ds) =>
                                                            ds.filter((_, j) => j !== i),
                                                        )
                                                    }
                                                    className="p-1.5 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition flex-shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setEditDistractors((ds) => [...ds, ""])}
                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition mt-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add distractor
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Explanation
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={2}
                                    value={editForm.explanation ?? ""}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            explanation: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Btn.Secondary
                                onClick={() => {
                                    setEditModalOpen(false);
                                    setEditingQuestion(null);
                                }}
                                disabled={editMutation.isPending}
                            >
                                Cancel
                            </Btn.Secondary>
                            <Btn.Primary
                                onClick={handleSaveEdit}
                                disabled={editMutation.isPending}
                            >
                                {editMutation.isPending ? "Saving..." : "Save"}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}

            {/* GENERATE MODAL */}
            {generateModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-2xl shadow-shell w-full max-w-lg p-6 border border-slate-100 animate-slideIn">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        AI Generation
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Generate Questions
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setGenerateModalOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-5 text-sm">
                            {generateError && (
                                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                                    {generateError}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Count
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={generateCount}
                                        onChange={(e) =>
                                            setGenerateCount(Number(e.target.value))
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Difficulty
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={generateDifficulty}
                                        onChange={(e) =>
                                            setGenerateDifficulty(e.target.value)
                                        }
                                    >
                                        <option value="A1">A1</option>
                                        <option value="A2">A2</option>
                                        <option value="B1">B1</option>
                                        <option value="B2">B2</option>
                                        <option value="C1">C1</option>
                                        <option value="C2">C2</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Btn.Secondary
                                onClick={() => setGenerateModalOpen(false)}
                                disabled={generateMutation.isPending}
                            >
                                Cancel
                            </Btn.Secondary>
                            <Btn.Primary
                                onClick={handleGenerate}
                                disabled={generateMutation.isPending || !lessonId}
                            >
                                {generateMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate
                                    </>
                                )}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonExercisesPage;
