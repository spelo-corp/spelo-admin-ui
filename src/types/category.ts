// Category types based on API documentation

/**
 * Category list item returned by GET /api/v1/categories
 * This is the shape of items in the paginated response
 */
export interface CategoryListItemDTO {
    id: number;
    parent_id: number;
    name: string;
    image: string;
    description: string;
    lesson_count: number;
    min_level: string; // e.g., "A1", "B2"
    max_level: string;
}

/**
 * Full category type with optional fields
 * Used for internal state management
 */
export interface Category {
    id: number;
    parent_id?: number;
    name: string;
    image?: string;
    description?: string;
    status?: number; // For filtering active/inactive categories
    lesson_count?: number;
    min_level?: string;
    max_level?: string;
}

/**
 * Paginated response from GET /api/v1/categories
 */
export interface CategoryListResponse {
    success: boolean;
    code: number;
    message: string;
    data: CategoryListItemDTO[];
    total: number;
}

export interface CategoryRequestDTO {
    parent_id?: number;
    name: string;
    image?: string;
    description?: string;
    status: number;
}
