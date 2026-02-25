export const STEP_KEYS = [
    "audio_align",
    "vocab_enrich",
    "vocab_extraction",
    "vocab_script_map",
    "lesson_translation",
    "collection_generate",
    "collection_pronounce",
    "conditional_gateway",
    "parallel_gateway",
    "wait",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export const JOB_TYPES = [
    "VOCAB_ENRICH",
    "VOCAB_EXTRACT",
    "VOCAB_SCRIPT_MAP",
    "AUDIO_ALIGN",
    "YOUTUBE_ALIGN",
    "LESSON_TRANSLATE",
    "AI_SCORING",
    "COLLECTION_GENERATE",
    "NEWS_SCRAPE",
    "PDF_PARSE",
    "UPLOAD_TO_R2",
    "BOOK_INGEST",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export interface PipelineStepDTO {
    id: number;
    stepKey: string;
    sequence: number;
    config: string | null;
    retryCount: number;
    retryBackoffMs: number;
    failureMode: "ABORT" | "SKIP" | "RETRY";
    skipOnFail: boolean;
    timeoutMs: number | null;
    conditionExpression: string | null;
    isParallel: boolean;
}

export interface PipelineDTO {
    id: number;
    jobType: JobType | string;
    name: string;
    description: string;
    isActive: boolean;
    steps: PipelineStepDTO[];
    createdAt: string;
    updatedAt: string;
}

export interface CreatePipelineRequest {
    jobType: JobType | string;
    name: string;
    description?: string;
}

export interface CreatePipelineStepRequest {
    stepKey: string;
    sequence: number;
    config?: string;
    retryCount?: number;
    retryBackoffMs?: number;
    failureMode?: "ABORT" | "SKIP" | "RETRY";
    skipOnFail?: boolean;
    timeoutMs?: number | null;
    conditionExpression?: string | null;
    isParallel?: boolean;
}
