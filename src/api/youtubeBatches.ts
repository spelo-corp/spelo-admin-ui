import type { BatchDetail, YouTubeIngestionBatch } from "../types/youtube";
import { BASE_URL, getAuthHeaders, handle } from "./base";

async function listBatches(params?: { page?: number; size?: number }) {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    return handle<{ success: boolean; data: YouTubeIngestionBatch[]; total: number }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/batches${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function getBatch(id: number): Promise<BatchDetail> {
    const res = await handle<{ success: boolean; data: BatchDetail }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/batches/${id}`, {
            headers: getAuthHeaders(),
        }),
    );
    return res.data;
}

async function createBatch(payload: {
    video_pk_ids: number[];
    name?: string;
    default_lesson_level?: string;
    default_category_id?: number;
}): Promise<YouTubeIngestionBatch> {
    const res = await handle<{ success: boolean; data: YouTubeIngestionBatch }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/batches`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        }),
    );
    return res.data;
}

async function cancelBatch(id: number): Promise<YouTubeIngestionBatch> {
    const res = await handle<{ success: boolean; data: YouTubeIngestionBatch }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/batches/${id}/cancel`, {
            method: "POST",
            headers: getAuthHeaders(),
        }),
    );
    return res.data;
}

async function retryFailedBatch(id: number): Promise<YouTubeIngestionBatch> {
    const res = await handle<{ success: boolean; data: YouTubeIngestionBatch }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/batches/${id}/retry-failed`, {
            method: "POST",
            headers: getAuthHeaders(),
        }),
    );
    return res.data;
}

export const youtubeBatchesApi = {
    listBatches,
    getBatch,
    createBatch,
    cancelBatch,
    retryFailedBatch,
};
