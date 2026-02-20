import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type {
    Collection,
    CollectionListItemDTO,
    CollectionRequestDTO,
    CollectionTerminologyDTO,
} from "../types/collection";

const COLLECTIONS_QUERY_KEY = ["collections"];

const normalizeCollection = (dto: CollectionListItemDTO | Record<string, any>): Collection => {
    const raw = dto as Record<string, any>;
    return {
        id: Number(raw.id ?? 0),
        name: raw.collection_name ?? raw.collectionName ?? raw.name ?? "",
        description: raw.description,
        image: raw.image,
        type: raw.type ?? "USER",
        price: typeof raw.price === "number" ? raw.price : undefined,
        status: Number(raw.status ?? 1),
        created_at: raw.created_at ?? raw.createdAt ?? undefined,
        updated_at: raw.updated_at ?? raw.updatedAt ?? undefined,
        total_words: raw.total_words ?? raw.totalWords ?? raw.word_count ?? raw.wordCount ?? undefined,
    };
};

export function useCollections() {
    return useQuery({
        queryKey: COLLECTIONS_QUERY_KEY,
        queryFn: async () => {
            const res = await api.getCollections();
            if (res?.data && Array.isArray(res.data)) {
                return res.data.map((dto) => normalizeCollection(dto));
            }
            return [];
        },
    });
}

export function useLibraryCollections(page = 0, size = 100) {
    return useQuery({
        queryKey: [...COLLECTIONS_QUERY_KEY, "library", page, size],
        queryFn: async () => {
            const res = await api.getLibraryCollections(page, size);
            if (res?.data && Array.isArray(res.data)) {
                return res.data.map((dto) => normalizeCollection(dto));
            }
            return [];
        },
    });
}

export function useCreateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CollectionRequestDTO) => api.createCollection(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        },
    });
}

export function useUpdateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CollectionRequestDTO }) =>
            api.updateCollection(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        },
    });
}

export function useDeleteCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => api.deleteCollection(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        },
    });
}

export function useAddTerminologiesToCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CollectionTerminologyDTO[]) => api.addTerminologiesToCollection(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["collections", "terminologies"] });
        },
    });
}

export function useCollectionTerminologies(collectionId?: number, enabled = false) {
    return useQuery({
        queryKey: ["collections", "terminologies", collectionId],
        enabled: enabled && Number.isFinite(collectionId) && (collectionId ?? 0) > 0,
        queryFn: async () => {
            if (!collectionId) return [];
            const res = await api.getCollectionTerminologies(collectionId);
            return res?.data ?? [];
        },
    });
}

export function useGenerateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: {
            collection_id?: number;
            collection_name?: string;
            prompt_hint?: string;
            word_count?: number;
            tts_provider?: string;
            word_type_distribution?: {
                word: number;
                phrasal_verb?: number;
                idiom?: number;
            };
        }) => api.generateCollection(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COLLECTIONS_QUERY_KEY });
        },
    });
}
