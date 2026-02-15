// Job types from the API
export type JobType =
    | "AUDIO_ALIGN"
    | "VOCAB_ENRICH"
    | "VOCAB_EXTRACT"
    | "VOCAB_SCRIPT_MAP"
    | "LESSON_TRANSLATE"
    | "AI_SCORING"
    | "UPLOAD_TO_R2"
    | "COLLECTION_GENERATE";

export type JobServiceStatus =
    | "PENDING"
    | "RUNNING"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED"
    | "WAITING_FOR_INPUT"
    | "REVIEWING";

// Main Job interface matching /api/v1/jobs response
export interface Job {
    id: number;
    job_type: JobType;
    status: JobServiceStatus;
    total_items: number | null;
    completed_items: number | null;
    failed_items: number | null;
    progress_percent: number | null;
    current_step: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    input_payload?: unknown;
    result_payload?: unknown;
}

// Paginated response from /api/v1/jobs
export interface JobsListResponse {
    success: boolean;
    code: number;
    message: string;
    data: Job[];
    total: number;
    page: number;
    size: number;
}

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

export interface JobDetail<TDetail = unknown> {
    id: number;
    job_type: JobType;
    status: JobServiceStatus;
    total_items: number | null;
    completed_items: number | null;
    failed_items: number | null;
    progress_percent: number | null;
    current_step: string | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    detail: TDetail;
}

export interface JobDetailResponse<TDetail = unknown> {
    success: boolean;
    data: JobDetail<TDetail>;
}
