export type JobStatus =
    | "pending"
    | "extracting"
    | "extracted"
    | "reviewing"
    | "completed"
    | "failed"
    | "cancelled";

export interface DashboardStats {
    total_lessons: number;
    processing_jobs: number;
    audio_files: number;
    active_users: number;
}

export interface ProcessingJob {
    id: number;
    lesson_id: number;
    lesson_name?: string;
    original_audio_url: string;
    current_step: JobStatus;
    created_at: string;
    progress_percent?: number;
}

export interface Lesson {
    id: number;
    name: string;
    level: string;
    category_id: number;
    description?: string;
    status?: number;
    image?: string;
}

export interface Sentence {
    text: string;
    translated_text?: string;
    start_time: number;
    end_time: number;
    accuracy?: number; // for MFA coloring
}

export interface ProcessingJobDetail {
    job_id: number;
    audio_url: string;
    sentences: Sentence[];
}

export interface AudioFile {
    id: number;
    file_name: string;
    url: string;
    // add more fields here if your API returns them (e.g. duration, size, lesson_id, etc.)
}