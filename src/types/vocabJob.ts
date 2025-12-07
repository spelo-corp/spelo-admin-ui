export type VocabJobStatus =
    | "PENDING"
    | "RUNNING"
    | "PARTIAL"
    | "COMPLETED"
    | "FAILED";

export type VocabJobItemStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface VocabJobItem {
    id: number;
    word: string;
    status: VocabJobItemStatus;
    error_message?: string | null;
}

export interface VocabJob {
    id: number;
    total_words: number;
    completed_words: number;
    failed_words: number;
    status: VocabJobStatus;
    created_at: string;
    updated_at: string;
    items: VocabJobItem[];
}

export interface AutoCreateVocabRequest {
    words: string[];
}
