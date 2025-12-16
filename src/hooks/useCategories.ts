import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Category, CategoryRequestDTO } from "../types/category";

// Query key for categories
const CATEGORIES_QUERY_KEY = ["categories"];

/**
 * Hook to fetch categories with automatic caching
 */
export function useCategories() {
    return useQuery({
        queryKey: CATEGORIES_QUERY_KEY,
        queryFn: async () => {
            const res = await api.getCategories();
            if (res.success && res.data && res.data.length > 0) {
                // Convert CategoryListItemDTO to Category for internal use
                const categories: Category[] = res.data.map((dto) => ({
                    id: dto.id,
                    parent_id: dto.parent_id,
                    name: dto.name,
                    image: dto.image,
                    description: dto.description,
                    lesson_count: dto.lesson_count,
                    min_level: dto.min_level,
                    max_level: dto.max_level,
                }));
                return categories;
            }
            return [];
        },
    });
}

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CategoryRequestDTO) => api.createCategory(data),
        onSuccess: () => {
            // Invalidate and refetch categories
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
        },
    });
}

/**
 * Hook to update an existing category
 */
export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CategoryRequestDTO }) =>
            api.updateCategory(id, data),
        onSuccess: () => {
            // Invalidate and refetch categories
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
        },
    });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => api.deleteCategory(id),
        onSuccess: () => {
            // Invalidate and refetch categories
            queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
        },
    });
}
