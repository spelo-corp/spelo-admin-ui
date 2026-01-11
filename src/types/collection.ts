// Collection types based on API documentation

export interface CollectionListItemDTO {
    id: number;
    collection_name: string;
    created_at?: string;
    updated_at?: string;
    total_words?: number;
}

export interface Collection {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
    total_words?: number;
}

export interface CollectionListResponse {
    success: boolean;
    data: CollectionListItemDTO[];
    message?: string;
    code?: number;
}

export interface CollectionRequestDTO {
    collection_name: string;
}

export interface CollectionTerminologyDTO {
    terminology: string;
    word_id: number;
    collection_id: number;
    definition?: {
        answer?: string;
    };
}
