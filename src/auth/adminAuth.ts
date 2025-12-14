const STORAGE_KEY = "spelo_admin_auth_v1";

const DEFAULT_USERNAME = (import.meta as any)?.env?.VITE_ADMIN_USER ?? "admin";
const DEFAULT_PASSWORD = (import.meta as any)?.env?.VITE_ADMIN_PASS ?? "admin";

type StoredAuth = {
    loggedIn: boolean;
    username: string;
    loggedInAt: number;
};

export function isAdminLoggedIn(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as Partial<StoredAuth>;
        return parsed.loggedIn === true;
    } catch {
        return false;
    }
}

export function getAdminUsername(): string | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<StoredAuth>;
        return typeof parsed.username === "string" ? parsed.username : null;
    } catch {
        return null;
    }
}

export function adminLogin(payload: { username: string; password: string }): {
    success: boolean;
    message?: string;
} {
    const username = payload.username.trim();
    const password = payload.password;

    if (!username || !password) {
        return { success: false, message: "Username and password are required." };
    }

    if (username !== DEFAULT_USERNAME || password !== DEFAULT_PASSWORD) {
        return { success: false, message: "Invalid username or password." };
    }

    const stored: StoredAuth = {
        loggedIn: true,
        username,
        loggedInAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return { success: true };
}

export function adminLogout() {
    localStorage.removeItem(STORAGE_KEY);
}

