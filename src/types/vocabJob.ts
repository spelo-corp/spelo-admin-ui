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

export interface ExtractVocabFromLessonRequest {
    include_stop_words?: boolean;
    min_word_length?: number;
}

export interface ExtractVocabFromLessonResponse {
    job_id?: number | null;
    extracted_words_total?: number;
    new_words_total?: number;
    existing_words_total?: number;
    new_words?: string[];
    existing_words?: string[];

    // tolerate alternate casing from backend
    jobId?: number | null;
    extractedWordsTotal?: number;
    newWordsTotal?: number;
    existingWordsTotal?: number;
    newWords?: string[];
    existingWords?: string[];
}

export interface MapVocabScriptRequest {
    listening_lesson_ids?: number[];
}

export interface MapVocabScriptResponse {
    job_id?: number;
    total_lessons?: number;
    listening_lesson_ids?: number[];

    // tolerate alternate casing from backend
    jobId?: number;
    totalLessons?: number;
    listeningLessonIds?: number[];
}
