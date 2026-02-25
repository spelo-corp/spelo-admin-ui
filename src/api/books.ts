import type {
    BookIngestionUploadResponse,
    ContentSection,
    ContentSentence,
    ContentSource,
} from "../types/book";
import { BASE_URL, getAuthHeaders, handle } from "./base";

export const booksApi = {
    async uploadBook(file: File): Promise<BookIngestionUploadResponse> {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch(`${BASE_URL}/api/v1/ingestion/upload-book`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        });

        return handle<{ data: BookIngestionUploadResponse }>(res).then((r) => r.data);
    },

    async getContentSources(params?: {
        page?: number;
        size?: number;
        status?: string;
    }): Promise<{ content: ContentSource[]; totalElements: number }> {
        const query = new URLSearchParams();
        if (params?.page != null) query.set("page", String(params.page));
        if (params?.size != null) query.set("size", String(params.size));
        if (params?.status) query.set("status", params.status);

        const qs = query.toString();
        const res = await fetch(`${BASE_URL}/api/v1/content/sources${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        });

        return handle<{ data: { content: ContentSource[]; totalElements: number } }>(res).then(
            (r) => r.data,
        );
    },

    async getContentSource(id: number): Promise<ContentSource> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sources/${id}`, {
            headers: getAuthHeaders(),
        });

        return handle<{ data: ContentSource }>(res).then((r) => r.data);
    },

    async getContentSections(sourceId: number): Promise<ContentSection[]> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sources/${sourceId}/sections`, {
            headers: getAuthHeaders(),
        });

        return handle<{ data: ContentSection[] }>(res).then((r) => r.data);
    },

    async getSectionSentences(sectionId: number): Promise<ContentSentence[]> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sections/${sectionId}/sentences`, {
            headers: getAuthHeaders(),
        });

        return handle<{ data: ContentSentence[] }>(res).then((r) => r.data);
    },
};
