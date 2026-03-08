import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { DialogueScenarioRequest } from "../types/dialogueScenario";

const DIALOGUE_SCENARIOS_KEY = ["dialogueScenarios"];

export function useDialogueScenarios() {
    return useQuery({
        queryKey: DIALOGUE_SCENARIOS_KEY,
        queryFn: async () => {
            const res = await api.getDialogueScenarios();
            return res.data ?? [];
        },
    });
}

export function useCreateDialogueScenario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: DialogueScenarioRequest) => api.createDialogueScenario(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIALOGUE_SCENARIOS_KEY });
        },
    });
}

export function useUpdateDialogueScenario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: DialogueScenarioRequest }) =>
            api.updateDialogueScenario(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIALOGUE_SCENARIOS_KEY });
        },
    });
}

export function useDeleteDialogueScenario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => api.deleteDialogueScenario(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIALOGUE_SCENARIOS_KEY });
        },
    });
}

export function useToggleDialogueScenario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
            activate ? api.activateDialogueScenario(id) : api.deactivateDialogueScenario(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIALOGUE_SCENARIOS_KEY });
        },
    });
}
