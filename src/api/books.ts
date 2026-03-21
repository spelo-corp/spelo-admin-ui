import type {
    BookIngestionUploadResponse,
    ContentSection,
    ContentSentence,
    ContentSource,
    SentenceMetadata,
} from "../types/book";
import type { Job } from "../types/jobService";
import { type ImageProcessingOptions, processImage } from "../utils/imageProcessing";
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

        return handle<BookIngestionUploadResponse>(res);
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

        return handle<{ data: ContentSource[]; total: number }>(res).then((r) => ({
            content: r.data,
            totalElements: r.total,
        }));
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

    async getBookIngestJob(jobId: number): Promise<Job> {
        const res = await fetch(`${BASE_URL}/api/v1/jobs/${jobId}`, {
            headers: getAuthHeaders(),
        });

        return handle<{ data: Job }>(res).then((r) => r.data);
    },

    async updateSentence(
        sentenceId: number,
        data: {
            text: string;
            sequence: number;
            paragraph_index: number | null;
            token_count: number | null;
            metadata: SentenceMetadata | null;
        },
    ): Promise<ContentSentence> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sentences/${sentenceId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        return handle<{ data: ContentSentence }>(res).then((r) => r.data);
    },

    async deleteContentSource(id: number): Promise<void> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sources/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        return handle<{ data: void }>(res).then(() => {});
    },

    async updateSource(
        sourceId: number,
        data: { title: string; author?: string; language?: string },
    ): Promise<ContentSource> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sources/${sourceId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handle<{ data: ContentSource }>(res).then((r) => r.data);
    },

    async createSection(
        sourceId: number,
        data: { title: string; section_type?: string },
    ): Promise<ContentSection> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sources/${sourceId}/sections`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handle<{ data: ContentSection }>(res).then((r) => r.data);
    },

    async updateSection(
        sectionId: number,
        data: { title?: string; sequence?: number },
    ): Promise<ContentSection> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sections/${sectionId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handle<{ data: ContentSection }>(res).then((r) => r.data);
    },

    async deleteSection(sectionId: number): Promise<void> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sections/${sectionId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handle<{ data: void }>(res).then(() => {});
    },

    async createSentence(
        sectionId: number,
        data: {
            text: string;
            sequence: number;
            block_type?: string;
            paragraph_index?: number | null;
            token_count?: number | null;
            metadata?: SentenceMetadata | null;
        },
    ): Promise<ContentSentence> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sections/${sectionId}/sentences`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handle<{ data: ContentSentence }>(res).then((r) => r.data);
    },

    async deleteSentence(sentenceId: number): Promise<void> {
        const res = await fetch(`${BASE_URL}/api/v1/content/sentences/${sentenceId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handle<{ data: void }>(res).then(() => {});
    },

    async uploadContentImage(file: File): Promise<string> {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${BASE_URL}/api/v1/file/spelo-content/upload`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        });
        const objectName = await handle<{ data: string }>(res).then((r) => r.data);
        return objectName;
    },

    async getPresignedUrl(bucketName: string, objectName: string): Promise<string> {
        const res = await fetch(
            `${BASE_URL}/api/v1/file/presigned_url/${bucketName}/${objectName}`,
            { headers: getAuthHeaders() },
        );
        return handle<{ data: string }>(res).then((r) => r.data);
    },

    async uploadCoverImage(
        sourceId: number,
        file: File,
        options?: ImageProcessingOptions,
    ): Promise<ContentSource> {
        const processedFile = await processImage(file, options || {});
        const form = new FormData();
        form.append("file", processedFile);

        const res = await fetch(
            `${BASE_URL}/api/v1/content/sources/${sourceId}/cover-image/upload`,
            {
                method: "PATCH",
                headers: getAuthHeaders({ contentType: null }),
                body: form,
            },
        );
        return handle<{ data: ContentSource }>(res).then((r) => r.data);
    },

    async reorderSentences(sectionId: number, sentenceIds: number[]): Promise<ContentSentence[]> {
        const res = await fetch(
            `${BASE_URL}/api/v1/content/sections/${sectionId}/sentences/reorder`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ sentence_ids: sentenceIds }),
            },
        );
        return handle<{ data: ContentSentence[] }>(res).then((r) => r.data);
    },
};
