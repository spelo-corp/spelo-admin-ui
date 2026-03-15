import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comprehensionApi } from "../api/comprehension";
import type {
    EditQuestionRequest,
    GenerateComprehensionRequest,
} from "../types/comprehension";

const COMPREHENSION_QUERY_KEY = "comprehension-questions";

/**
 * Hook to fetch comprehension questions with filters and pagination
 */
export function useComprehensionQuestions(params: {
    lessonId?: number;
    status?: string;
    page?: number;
    size?: number;
}) {
    return useQuery({
        queryKey: [COMPREHENSION_QUERY_KEY, params],
        queryFn: () => comprehensionApi.listComprehensionQuestions(params),
    });
}

/**
 * Hook to approve a comprehension question
 */
export function useApproveQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => comprehensionApi.approveQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPREHENSION_QUERY_KEY] });
        },
    });
}

/**
 * Hook to reject a comprehension question
 */
export function useRejectQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => comprehensionApi.rejectQuestion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPREHENSION_QUERY_KEY] });
        },
    });
}

/**
 * Hook to edit a comprehension question
 */
export function useEditQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: EditQuestionRequest }) =>
            comprehensionApi.editQuestion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPREHENSION_QUERY_KEY] });
        },
    });
}

/**
 * Hook to generate comprehension questions for a lesson
 */
export function useGenerateComprehensionQuestions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            lessonId,
            data,
        }: {
            lessonId: number;
            data: GenerateComprehensionRequest;
        }) => comprehensionApi.generateComprehensionQuestions(lessonId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COMPREHENSION_QUERY_KEY] });
        },
    });
}
