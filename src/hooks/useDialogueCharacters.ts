import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { DialogueCharacterRequest } from "../types/dialogueScenario";

const DIALOGUE_CHARACTERS_KEY = ["dialogueCharacters"];

export function useDialogueCharacters() {
    return useQuery({
        queryKey: DIALOGUE_CHARACTERS_KEY,
        queryFn: async () => {
            const res = await api.getDialogueCharacters();
            return res.data ?? [];
        },
    });
}

export function useCreateDialogueCharacter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: DialogueCharacterRequest) => api.createDialogueCharacter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIALOGUE_CHARACTERS_KEY });
        },
    });
}

export function useUpdateDialogueCharacter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: DialogueCharacterRequest }) =>
            api.updateDialogueCharacter(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIALOGUE_CHARACTERS_KEY });
        },
    });
}

export function useDeleteDialogueCharacter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => api.deleteDialogueCharacter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DIALOGUE_CHARACTERS_KEY });
        },
    });
}
