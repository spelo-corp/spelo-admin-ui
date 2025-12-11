import type { DashboardStats } from "../types";
import { BASE_URL_V2, handle } from "./base";

async function getDashboardStats() {
    return handle<{ success: boolean; stats: DashboardStats }>(
        await fetch(`${BASE_URL_V2}/api/admin/dashboard/stats`)
    );
}

export const dashboardApi = { getDashboardStats };
