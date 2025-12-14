export type JobServiceStatus =
    | "PENDING"
    | "RUNNING"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED";

export interface JobListItemDTO {
    id: number;
    job_type: string;
    status: JobServiceStatus;
    total_items: number;
    completed_items: number;
    failed_items: number;
    progress_percent: number;
    current_step: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

