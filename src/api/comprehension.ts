import type {
    ComprehensionQuestionsPage,
    EditQuestionRequest,
    GenerateComprehensionRequest,
} from "../types/comprehension";
import { BASE_URL, getAuthHeaders, handle } from "./base";

// List comprehension questions with optional filters
async function listComprehensionQuestions(params: {
    lessonId?: number;
    status?: string;
    page?: number;
    size?: number;
}) {
    const query = new URLSearchParams();
    if (params.lessonId) query.set("lesson_id", String(params.lessonId));
    if (params.status) query.set("status", params.status);
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.size !== undefined) query.set("size", String(params.size));

    return handle<ComprehensionQuestionsPage>(
        await fetch(
            `${BASE_URL}/api/v1/admin/comprehension-questions?${query.toString()}`,
            { headers: getAuthHeaders() },
        ),
    );
}

// Approve a comprehension question
async function approveQuestion(id: number) {
    return handle<{ success: boolean }>(
        await fetch(
            `${BASE_URL}/api/v1/admin/comprehension-questions/${id}/approve`,
            {
                method: "PATCH",
                headers: getAuthHeaders(),
            },
        ),
    );
}

// Reject a comprehension question
async function rejectQuestion(id: number) {
    return handle<{ success: boolean }>(
        await fetch(
            `${BASE_URL}/api/v1/admin/comprehension-questions/${id}/reject`,
            {
                method: "PATCH",
                headers: getAuthHeaders(),
            },
        ),
    );
}

// Edit a comprehension question
async function editQuestion(id: number, data: EditQuestionRequest) {
    return handle<{ success: boolean }>(
        await fetch(
            `${BASE_URL}/api/v1/admin/comprehension-questions/${id}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            },
        ),
    );
}

// Generate comprehension questions for a lesson
async function generateComprehensionQuestions(
    lessonId: number,
    data: GenerateComprehensionRequest,
) {
    return handle<{ success: boolean; message: string }>(
        await fetch(
            `${BASE_URL}/api/v1/admin/lessons/${lessonId}/comprehension-questions/generate`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            },
        ),
    );
}

export const comprehensionApi = {
    listComprehensionQuestions,
    approveQuestion,
    rejectQuestion,
    editQuestion,
    generateComprehensionQuestions,
};
