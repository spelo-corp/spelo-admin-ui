import type { JobListItemDTO } from "./jobService";
import type { Lesson } from "../types";

export type DashboardRange = "24h" | "7d" | "30d";
export type DashboardBucket = "hour" | "day";

export interface AdminDashboardKpis {
    lessons_total: number;
    lessons_active: number;
    lessons_inactive: number;
    audio_files_total: number;
    users_total: number;
    users_active: number;
    jobs_total: number;
    jobs_running: number;
    jobs_pending: number;
    jobs_completed: number;
    jobs_failed: number;
    jobs_partial: number;
    jobs_failure_rate_percent: number;
}

export interface AdminDashboardJobsByTypeItem {
    job_type: string;
    total: number;
    running: number;
    pending: number;
    completed: number;
    failed: number;
    partial: number;
}

export interface AdminDashboardSeriesItem {
    bucket_start: string;
    jobs_created: number;
    jobs_completed: number;
    jobs_failed: number;
    lessons_created: number;
    users_created: number;
    audio_uploaded: number;
}

export interface AdminDashboardOverviewResponse {
    success: boolean;
    code?: number;
    message?: string;
    data: {
        kpis: AdminDashboardKpis;
        jobs_by_type: AdminDashboardJobsByTypeItem[];
        bucket: DashboardBucket;
        series: AdminDashboardSeriesItem[];
    };
}

export interface AdminDashboardAlertsResponse {
    success: boolean;
    code?: number;
    message?: string;
    data: {
        stuck_jobs: JobListItemDTO[];
        failed_jobs: JobListItemDTO[];
        partial_jobs: JobListItemDTO[];
    };
}

export type AdminDashboardActivityType =
    | "JOB_STATUS_CHANGED"
    | "LESSON_UPDATED"
    | "LESSON_CREATED"
    | "AUDIO_UPLOADED";

export interface AdminDashboardActivityItem {
    id: string;
    type: AdminDashboardActivityType | string;
    created_at: string;
    actor_user_id?: number | null;
    message: string;
    entity?: {
        kind: "JOB" | "LESSON" | "LISTENING_LESSON" | string;
        id: number | string;
    };
}

export interface AdminDashboardActivityResponse {
    success: boolean;
    code?: number;
    message?: string;
    data: AdminDashboardActivityItem[];
}

export type RecentLesson = Lesson & {
    created_at?: string;
    updated_at?: string;
    created_by?: number;
};

export interface AdminDashboardRecentLessonsResponse {
    success: boolean;
    code?: number;
    message?: string;
    data: RecentLesson[];
}

export interface AdminDashboardRecentAudioFileItem {
    id: number;
    lesson_id: number;
    created_at: string;
    updated_at?: string;
    audio?: string;
}

export interface AdminDashboardRecentAudioFilesResponse {
    success: boolean;
    code?: number;
    message?: string;
    data: AdminDashboardRecentAudioFileItem[];
}
