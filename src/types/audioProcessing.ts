export type AudioJobStatus =
    | "WAITING_FOR_INPUT"
    | "READY_TO_PROCESS"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "FINALIZED"
    | "REPROCESSING"
    | "PENDING"
    | "RUNNING"
    | "PARTIAL"
    | "REVIEWING";

export interface AudioSentence {
    text: string;
    start: number; // seconds
    end: number;   // seconds
}

export interface AudioJob {
    id: number;
    status: AudioJobStatus;
    lessonId: number;
    lessonName?: string;
    transcript: string;
    translatedScript?: string;
    type?: number;
    audioUrl?: string;
    sentences?: AudioSentence[];
    progressPercent?: number | null;
    currentStep?: string | null;
    totalItems?: number | null;
    completedItems?: number | null;
    failedItems?: number | null;
    createdAt: string;
    updatedAt: string;
    finalizedAt?: string;
}
