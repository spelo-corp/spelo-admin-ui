export type JobStatus =
    | "pending"
    | "extracting"
    | "extracted"
    | "reviewing"
    | "completed"
    | "audio_uploaded"
    | "uploading_audio"
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

    upload_task_id?: string;
}

export type LessonLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface Lesson {
    id: number;
    name: string;
    level: LessonLevel;
    category_id: number;
    description?: string;
    status?: number;
    image?: string;
    gems?: number;
}

export interface Sentence {
    index: number;
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
    url: string;
    file_name: string;
    lesson_id?: number;
    duration?: number;
    created_at?: string;
}

export interface ListeningLessonData {
    audio?: string;
    start?: number;
    end?: number;
}

export interface ListeningLessonScript {
    id?: number;
    w?: string;
}

export interface WordPronunciation {
    dialect?: string;
    audio?: string | null;
    ipa?: string;
}

export interface WordMeaning {
    definition?: string;
    example?: string;
    translation?: string;
}

export interface WordData {
    pronunciations?: WordPronunciation[];
    meaning?: WordMeaning;
}

export interface WordResponseDTO {
    id: number;
    word: string;
    word_definition: WordData;
}

export interface ListeningLessonDTO {
    id: number;
    type: number;
    data: ListeningLessonData;
    status: number;
    script: ListeningLessonScript[];
    str_script: string;
    translated_script: string;
    new_words: WordResponseDTO[];
}

export type TokenDiffType = "MATCH" | "MATCH_FUZZY" | "SUBSTITUTE" | "MISSING" | "EXTRA";

export interface TokenDiff {
    expected: string | null;
    actual: string | null;
    type: TokenDiffType;
    score: number;
    reason: string;
}

export interface ListeningAnswerDTO {
    total_tokens: number;
    correct_exact: number;
    correct_fuzzy: number;
    accuracy_exact: number;
    accuracy_weighted: number;
    expected_normalized: string;
    user_normalized: string;
    diffs: TokenDiff[];
    missing_words: string[];
    extra_words: string[];
    feedback: string[];
}

export interface LessonDetail {
    lesson_id: number;
    lesson_name: string;
    lesson_details: ListeningLessonDTO[];
    total_elements: number;
    total_pages: number;

    // Optional metadata if fetched separately
    level?: LessonLevel;
    category_id?: number;
    description?: string;
    status?: number;
    image?: string;
    gems?: number;
}

export interface VocabWordDefinition {
    pronunciations: WordPronunciation[];
    meaning: WordMeaning;
}

export interface VocabWord {
    id: number;
    word: string;

    word_definition: VocabWordDefinition;
    wordDefinition?: VocabWordDefinition; // allow camelCase payloads from API

    createdAt?: string;
    updatedAt?: string;
}
