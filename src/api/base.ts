import { getAdminToken } from "../auth/adminAuth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api.spelo.dev";

function getAuthHeaders(options?: { contentType?: string | null }) {
    const token = getAdminToken() ?? "";

    const headers: Record<string, string> = {
        Authorization: token ? `Bearer ${token}` : "",
    };

    const contentType = options?.contentType;
    if (contentType !== null) {
        headers["Content-Type"] = contentType ?? "application/json";
    }

    return headers;
}

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
    }
    return await res.json() as Promise<T>;
}

export { BASE_URL, getAuthHeaders, handle };

