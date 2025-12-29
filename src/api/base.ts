const BASE_URL_V2 = "https://api.spelo.dev";
const JOB_BASE_URL = "https://api.spelo.dev";
const AUDIO_BASE_URL = `${BASE_URL_V2}/api/v1/audio-processing`;

function getAuthHeaders(options?: { contentType?: string | null }) {
    const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJuZXVsYWFuaDE1QGdtYWlsLmNvbSIsImlhdCI6MTc2NDE0NDQ0NywiZXhwIjoyNjI4MTQ0NDQ3LCJzY3AiOiIiLCJpZCI6MX0.aU4NpOFI5HVNd925-MUeNu8X6s7s6TPt583gjsB_zsLI_hhzzIhsWlSnHpJy-PtCED9HGL6tmK0RLe0NwQdPxA";

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

export { BASE_URL_V2, JOB_BASE_URL, AUDIO_BASE_URL, getAuthHeaders, handle };
