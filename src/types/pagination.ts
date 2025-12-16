// Pagination types for API responses

export interface PaginatedResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface PaginationParams {
    page?: number;
    size?: number;
}
