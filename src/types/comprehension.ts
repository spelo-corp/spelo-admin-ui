export interface ComprehensionQuestion {
    id: number;
    source_type: string;
    source_id: number;
    question_text: string;
    correct_answer: string;
    distractors: string; // JSON string
    explanation: string | null;
    approval_status: "PENDING" | "APPROVED" | "REJECTED";
    audio_start_time: number | null;
    audio_end_time: number | null;
    question_order: number;
    created_at: string;
    updated_at: string;
}

export interface ComprehensionQuestionsPage {
    success: boolean;
    code: number;
    message: string;
    data: ComprehensionQuestion[];
    total: number;
}

export interface EditQuestionRequest {
    question_text?: string;
    correct_answer?: string;
    distractors?: string;
    explanation?: string;
}

export interface GenerateComprehensionRequest {
    transcript: string;
    question_count?: number;
    difficulty?: string;
}
