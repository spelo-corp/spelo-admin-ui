export interface ContentSource {
    id: number;
    sourceType: string;
    title: string;
    author: string;
    language: string;
    metadata: Record<string, unknown> | null;
    status: "PROCESSING" | "READY" | "DRAFT";
    totalSections: number;
    totalSentences: number;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
}

export interface ContentSection {
    id: number;
    sourceId: number;
    sectionType: string;
    title: string;
    sequence: number;
    rawText: string;
    status: "PENDING" | "COMPLETE";
    sentenceCount: number;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface WordMeta {
    word: string;
    clean_word: string;
    definition: string | null;
    translation: string | null;
    ipa: string | null;
    example: string | null;
    sense_id: number | null;
    no_sense: boolean | null;
}

export interface SentenceMetadata {
    translation: string | null;
    contains_latex: boolean | null;
    words: WordMeta[];
    [key: string]: unknown;
}

export interface ContentSentence {
    id: number;
    sectionId: number;
    sourceId: number;
    sequence: number;
    text: string;
    paragraphIndex: number;
    charOffset: number;
    tokenCount: number;
    metadata: SentenceMetadata | null;
    createdAt: string;
}

export type BookIngestionUploadResponse = {
    message: string;
    jobId: number;
    objectKey: string;
};
