export interface ComprehensionQuestion {
    id: number;
    sourceType: string;
    sourceId: number;
    questionText: string;
    correctAnswer: string;
    distractors: string; // JSON string
    explanation: string | null;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    audioStartTime: number | null;
    audioEndTime: number | null;
    questionOrder: number;
    createdAt: string;
    updatedAt: string;
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
    question_count?: number;
    difficulty?: string;
}
