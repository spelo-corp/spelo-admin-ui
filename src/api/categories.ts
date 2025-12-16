import { BASE_URL_V2, handle, getAuthHeaders } from "./base";
import type { Category, CategoryRequestDTO, CategoryListResponse } from "../types/category";

// Get all categories
async function getCategories() {
    return handle<CategoryListResponse>(
        await fetch(`${BASE_URL_V2}/api/v1/categories?parent_id=0`, {
            headers: getAuthHeaders(),
        })
    );
}

// Get category by ID
async function getCategoryById(id: number) {
    return handle<{ success: boolean; data: Category }>(
        await fetch(`${BASE_URL_V2}/api/v1/categories/${id}`, {
            headers: getAuthHeaders(),
        })
    );
}

// Create new category
async function createCategory(data: CategoryRequestDTO) {
    return handle<{ success: boolean; data: Category }>(
        await fetch(`${BASE_URL_V2}/api/v1/categories`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        })
    );
}

// Update existing category
async function updateCategory(id: number, data: CategoryRequestDTO) {
    return handle<{ success: boolean; data: Category }>(
        await fetch(`${BASE_URL_V2}/api/v1/categories/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        })
    );
}

// Delete category (soft delete)
async function deleteCategory(id: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL_V2}/api/v1/categories/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        })
    );
}

export const categoriesApi = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
