// src/pages/lesson/LessonExercisesPage.tsx

import {
    Check,
    ChevronLeft,
    ChevronRight,
    Edit,
    Loader2,
    MessageSquareText,
    Sparkles,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";
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

function parseDistractorCount(distractors: string): number {
    try {
        const parsed = JSON.parse(distractors);
        return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
        return 0;
    }
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

const LessonExercisesPage = () => {
    const { lessonId: lessonIdParam } = useParams<{ lessonId: string }>();
    const { lessonMeta, lessonDetail } =
        useOutletContext<LessonOutletContext>();
    const lessonId = lessonIdParam ? Number(lessonIdParam) : undefined;

    const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
    const [page, setPage] = useState(0);

    // Edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] =
        useState<ComprehensionQuestion | null>(null);
    const [editForm, setEditForm] = useState<EditQuestionRequest>({});
    const [editError, setEditError] = useState<string | null>(null);

    // Generate modal
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [generateTranscript, setGenerateTranscript] = useState("");
    const [generateCount, setGenerateCount] = useState(5);
    const [generateDifficulty, setGenerateDifficulty] = useState("B1");
    const [generateError, setGenerateError] = useState<string | null>(null);

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
            questions.filter((q) => q.approval_status === "PENDING").length,
        [questions],
    );

    const isTrulyEmpty = questions.length === 0 && activeTab === "ALL";
    const isFilterEmpty = questions.length === 0 && activeTab !== "ALL";
    const hasQuestions = total > 0 || activeTab !== "ALL";

    // Transcript from lesson data
    const lessonTranscript = useMemo(() => {
        if (!lessonDetail?.lesson_details) return "";
        return lessonDetail.lesson_details
            .map(
                (d) =>
                    d.str_script ||
                    (d.script || [])
                        .map((w) => w.w)
                        .filter(Boolean)
                        .join(" "),
            )
            .filter(Boolean)
            .join("\n\n");
    }, [lessonDetail]);

    const openEditModal = (question: ComprehensionQuestion) => {
        setEditingQuestion(question);
        setEditForm({
            question_text: question.question_text,
            correct_answer: question.correct_answer,
            distractors: question.distractors,
            explanation: question.explanation ?? "",
        });
        setEditError(null);
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingQuestion) return;
        setEditError(null);
        try {
            await editMutation.mutateAsync({
                id: editingQuestion.id,
                data: editForm,
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
        setGenerateTranscript(lessonTranscript);
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
        if (!generateTranscript.trim()) {
            setGenerateError("Transcript is required.");
            return;
        }
        setGenerateError(null);
        try {
            await generateMutation.mutateAsync({
                lessonId,
                data: {
                    transcript: generateTranscript.trim(),
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
            {/* HEADER — Generate button only when questions exist */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Comprehension Questions
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{total} total</span>
                        {pendingCount > 0 && (
                            <>
                                <span className="text-slate-300">·</span>
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

            {/* UNDERLINE TABS — only show when questions exist */}
            {hasQuestions && (
                <div className="flex items-center gap-0 border-b border-slate-100">
                    {(
                        [
                            { label: "All", value: "ALL" as StatusTab },
                            {
                                label: "Pending",
                                value: "PENDING" as StatusTab,
                            },
                            {
                                label: "Approved",
                                value: "APPROVED" as StatusTab,
                            },
                            {
                                label: "Rejected",
                                value: "REJECTED" as StatusTab,
                            },
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
                            <Skeleton
                                key={`skeleton-${i}`}
                                className="h-10 w-full"
                            />
                        ))}
                    </div>
                ) : isTrulyEmpty ? (
                    /* TRUE EMPTY — no questions at all */
                    <div className="text-center py-16 space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                            <MessageSquareText className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-slate-700 text-sm">
                            No comprehension questions yet
                        </p>
                        <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                            Generate MCQ questions from the lesson transcript
                            using AI.
                        </p>
                        <div className="pt-2">
                            <Btn.Primary onClick={openGenerateModal}>
                                <Sparkles className="w-4 h-4" />
                                Generate Questions
                            </Btn.Primary>
                        </div>
                    </div>
                ) : isFilterEmpty ? (
                    /* FILTER EMPTY — questions exist but not for this filter */
                    <div className="text-center py-12">
                        <p className="text-sm text-slate-400">
                            No {activeTab.toLowerCase()} questions.
                        </p>
                    </div>
                ) : (
                    /* TABLE */
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-2.5 font-medium w-[44px]">
                                        #
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Question
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Answer
                                    </th>
                                    <th className="px-4 py-2.5 font-medium w-[80px]">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 font-medium w-[80px]">
                                        Created
                                    </th>
                                    <th className="px-4 py-2.5 font-medium w-[90px]" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {questions.map((q) => (
                                    <tr
                                        key={q.id}
                                        className="group hover:bg-slate-50/60 focus-within:bg-slate-50/60 transition"
                                    >
                                        <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">
                                            {q.id}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <p
                                                className="text-slate-800 text-sm line-clamp-2"
                                                title={q.question_text}
                                            >
                                                {q.question_text}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600 text-sm max-w-[180px]">
                                            <span className="truncate block">
                                                {q.correct_answer}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {statusBadge(q.approval_status)}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                                            {formatDate(q.created_at)}
                                        </td>
                                        {/* HOVER-REVEAL ACTIONS */}
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                                                {q.approval_status !==
                                                    "APPROVED" && (
                                                    <button
                                                        onClick={() =>
                                                            approveMutation.mutate(
                                                                q.id,
                                                            )
                                                        }
                                                        disabled={
                                                            approveMutation.isPending
                                                        }
                                                        className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {q.approval_status !==
                                                    "REJECTED" && (
                                                    <button
                                                        onClick={() =>
                                                            rejectMutation.mutate(
                                                                q.id,
                                                            )
                                                        }
                                                        disabled={
                                                            rejectMutation.isPending
                                                        }
                                                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        openEditModal(q)
                                                    }
                                                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION — icon-only */}
                {totalPages > 1 && questions.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-50">
                        <p className="text-xs text-slate-400">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() =>
                                    setPage((p) => Math.max(0, p - 1))
                                }
                                disabled={page === 0}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(totalPages - 1, p + 1),
                                    )
                                }
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
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Distractors (JSON array)
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
                                    rows={3}
                                    value={editForm.distractors ?? ""}
                                    onChange={(e) =>
                                        setEditForm((f) => ({
                                            ...f,
                                            distractors: e.target.value,
                                        }))
                                    }
                                />
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
                                {editMutation.isPending
                                    ? "Saving..."
                                    : "Save"}
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
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Transcript
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={6}
                                    value={generateTranscript}
                                    onChange={(e) =>
                                        setGenerateTranscript(e.target.value)
                                    }
                                    placeholder="Paste the lesson transcript here..."
                                />
                            </div>
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
                                            setGenerateCount(
                                                Number(e.target.value),
                                            )
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
                                            setGenerateDifficulty(
                                                e.target.value,
                                            )
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
                                disabled={
                                    generateMutation.isPending || !lessonId
                                }
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
