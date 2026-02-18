import type {
    AdminDashboardActivityResponse,
    AdminDashboardAlertsResponse,
    AdminDashboardOverviewResponse,
    AdminDashboardRecentAudioFilesResponse,
    AdminDashboardRecentLessonsResponse,
    DashboardRange,
} from "../types/adminDashboard";
import type { DashboardStats } from "../types";
import { BASE_URL, getAuthHeaders, handle } from "./base";

async function getDashboardStats() {
    return handle<{ success: boolean; stats: DashboardStats }>(
        await fetch(`${BASE_URL}/api/admin/dashboard/stats`, {
            headers: getAuthHeaders(),
        })
    );
}

async function getAdminDashboardOverview(range: DashboardRange = "7d") {
    return handle<AdminDashboardOverviewResponse>(
        await fetch(`${BASE_URL}/api/v1/admin/dashboard/overview?range=${range}`, {
            headers: getAuthHeaders(),
        })
    );
}

async function getAdminDashboardAlerts(params?: { stuck_minutes?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.stuck_minutes) query.set("stuck_minutes", String(params.stuck_minutes));
    if (params?.limit) query.set("limit", String(params.limit));

    return handle<AdminDashboardAlertsResponse>(
        await fetch(`${BASE_URL}/api/v1/admin/dashboard/alerts?${query.toString()}`, {
            headers: getAuthHeaders(),
        })
    );
}

async function getAdminDashboardActivity(params?: { limit?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));

    return handle<AdminDashboardActivityResponse>(
        await fetch(`${BASE_URL}/api/v1/admin/dashboard/activity?${query.toString()}`, {
            headers: getAuthHeaders(),
        })
    );
}

async function getAdminDashboardRecentLessons(params?: { limit?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));

    return handle<AdminDashboardRecentLessonsResponse>(
        await fetch(`${BASE_URL}/api/v1/admin/dashboard/recent-lessons?${query.toString()}`, {
            headers: getAuthHeaders(),
        })
    );
}

async function getAdminDashboardRecentAudioFiles(params?: { limit?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));

    return handle<AdminDashboardRecentAudioFilesResponse>(
        await fetch(`${BASE_URL}/api/v1/admin/dashboard/recent-audio-files?${query.toString()}`, {
            headers: getAuthHeaders(),
        })
    );
}

export const dashboardApi = {
    getDashboardStats,
    getAdminDashboardOverview,
    getAdminDashboardAlerts,
    getAdminDashboardActivity,
    getAdminDashboardRecentLessons,
    getAdminDashboardRecentAudioFiles,
};
