import { BASE_URL, getAuthHeaders, handle } from "./base";

async function uploadYouTubeCookies(file: File) {
    const form = new FormData();
    form.append("file", file);

    return handle<{ status: string; size: number }>(
        await fetch(`${BASE_URL}/api/v1/admin/settings/youtube-cookies`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        }),
    );
}

async function getYouTubeCookiesStatus() {
    return handle<{ configured: boolean; modified?: string; size?: number }>(
        await fetch(`${BASE_URL}/api/v1/admin/settings/youtube-cookies/status`, {
            headers: getAuthHeaders(),
        }),
    );
}

export const settingsApi = {
    uploadYouTubeCookies,
    getYouTubeCookiesStatus,
};
