import type {
    CatalogSyncResult,
    DailyMetrics,
    DashboardStats,
    QuotaStatus,
    YouTubeChannel,
    YouTubeSyncLog,
    YouTubeVideo,
} from "../types/youtube";
import { BASE_URL, getAuthHeaders, handle } from "./base";

async function listChannels(params?: {
    page?: number;
    size?: number;
    search?: string;
    isActive?: boolean;
}) {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));
    if (params?.search) query.set("search", params.search);
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));

    const qs = query.toString();
    return handle<{ success: boolean; data: YouTubeChannel[]; total: number }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function getChannel(id: number) {
    return handle<{ success: boolean; data: YouTubeChannel }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels/${id}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function registerChannel(payload: {
    url: string;
    default_lesson_level?: string;
    default_category_id?: number;
    min_duration_sec?: number;
    max_duration_sec?: number;
}) {
    return handle<{ success: boolean; data: YouTubeChannel }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        }),
    );
}

async function updateChannel(
    id: number,
    payload: Partial<{
        default_lesson_level: string;
        default_category_id: number;
        min_duration_sec: number;
        max_duration_sec: number;
        auto_sync_enabled: boolean;
        auto_queue_enabled: boolean;
        auto_finalize_enabled: boolean;
        auto_finalize_min_confidence: number;
        level_inference_enabled: boolean;
        is_active: boolean;
    }>,
) {
    return handle<{ success: boolean; data: YouTubeChannel }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        }),
    );
}

async function deactivateChannel(id: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        }),
    );
}

async function syncChannel(id: number, mode: "FULL" | "INCREMENTAL") {
    return handle<{ success: boolean; data: CatalogSyncResult }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels/${id}/sync`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ mode }),
        }),
    );
}

async function listVideos(params: {
    channel_id?: number;
    status?: string;
    min_duration?: number;
    max_duration?: number;
    published_after?: string;
    search?: string;
    page?: number;
    size?: number;
}) {
    const query = new URLSearchParams();
    if (params.channel_id !== undefined) query.set("channel_id", String(params.channel_id));
    if (params.status) query.set("status", params.status);
    if (params.min_duration !== undefined) query.set("min_duration", String(params.min_duration));
    if (params.max_duration !== undefined) query.set("max_duration", String(params.max_duration));
    if (params.published_after) query.set("published_after", params.published_after);
    if (params.search) query.set("search", params.search);
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    return handle<{ success: boolean; data: YouTubeVideo[]; total: number }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/videos${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function getVideo(id: number) {
    return handle<{ success: boolean; data: YouTubeVideo }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/videos/${id}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function updateVideoStatus(
    id: number,
    payload: { ingestion_status: string; skip_reason?: string },
) {
    return handle<{ success: boolean; data: YouTubeVideo }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/videos/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        }),
    );
}

async function refreshVideoMetadata(id: number) {
    return handle<{ success: boolean; data: YouTubeVideo }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/videos/${id}/refresh`, {
            method: "POST",
            headers: getAuthHeaders(),
        }),
    );
}

async function getSyncLog(channelId: number, params?: { page?: number; size?: number }) {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));

    const qs = query.toString();
    return handle<{ success: boolean; data: YouTubeSyncLog[]; total: number }>(
        await fetch(
            `${BASE_URL}/api/v1/admin/youtube/channels/${channelId}/sync-log${qs ? `?${qs}` : ""}`,
            { headers: getAuthHeaders() },
        ),
    );
}

async function getQuotaStatus() {
    return handle<{ success: boolean; data: QuotaStatus }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels/quota`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function getAnalytics(params?: { from?: string; to?: string; channelId?: number }) {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.channelId !== undefined) query.set("channelId", String(params.channelId));

    const qs = query.toString();
    return handle<{ success: boolean; data: DailyMetrics[] }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels/analytics${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function getDashboard() {
    return handle<{ success: boolean; data: DashboardStats }>(
        await fetch(`${BASE_URL}/api/v1/admin/youtube/channels/dashboard`, {
            headers: getAuthHeaders(),
        }),
    );
}

export const youtubeChannelsApi = {
    listChannels,
    getChannel,
    registerChannel,
    updateChannel,
    deactivateChannel,
    syncChannel,
    listVideos,
    getVideo,
    updateVideoStatus,
    refreshVideoMetadata,
    getSyncLog,
    getQuotaStatus,
    getAnalytics,
    getDashboard,
};
