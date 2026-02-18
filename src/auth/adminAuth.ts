import { BASE_URL } from "../api/base";

const STORAGE_KEY = "spelo_admin_auth_v1";

type StoredAuth = {
    token: string;
    username: string;
    loggedInAt: number;
    expiresAt: number;
};

export function isAdminLoggedIn(): boolean {
    const auth = getStoredAuth();
    if (!auth) return false;
    return auth.expiresAt > Date.now();
}

export function getAdminUsername(): string | null {
    const auth = getStoredAuth();
    return auth?.username ?? null;
}

export function getAdminToken(): string | null {
    const auth = getStoredAuth();
    if (!auth) return null;
    if (auth.expiresAt <= Date.now()) {
        adminLogout();
        return null;
    }
    return auth.token;
}

function getStoredAuth(): StoredAuth | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as StoredAuth;
    } catch {
        return null;
    }
}

export async function adminLogin(payload: { username: string; password: string }): Promise<{
    success: boolean;
    message?: string;
}> {
    try {
        const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return { success: false, message: "Invalid credentials" };
            }
            return { success: false, message: "Login failed" };
        }

        const data = await response.json();
        const stored: StoredAuth = {
            token: data.access_token,
            username: payload.username,
            loggedInAt: Date.now(),
            expiresAt: data.expire_at || (Date.now() + 24 * 60 * 60 * 1000)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        return { success: true };

    } catch (e) {
        console.error("Login error", e);
        return { success: false, message: "Connection error" };
    }
}

export function adminLogout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/admin/login";
}
