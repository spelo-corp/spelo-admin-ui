// Collection types based on API documentation

export interface CollectionListItemDTO {
    id: number;
    name: string;
    description?: string;
    image?: string;
    type: "USER" | "SHARED" | "LIBRARY";
    price?: number;
    status: number;
    created_at?: string;
    updated_at?: string;
    total_words?: number;
    created_by?: number;
    owner_name?: string;
}

export interface Collection {
    id: number;
    name: string;
    description?: string;
    image?: string;
    type: "USER" | "SHARED" | "LIBRARY";
    price?: number;
    status: number;
    created_at?: string;
    updated_at?: string;
    total_words?: number;
}

export interface CollectionListResponse {
    success: boolean;
    data: CollectionListItemDTO[];
    message?: string;
    code?: number;
    total?: number; // for pagination
}

export interface CollectionRequestDTO {
    collection_name: string;
    description?: string;
    image?: string;
    type?: "USER" | "SHARED" | "LIBRARY";
    price?: number;
    status?: number;
}

export interface CollectionTerminologyDTO {
    terminology: string;
    word_id: number;
    collection_id: number;
    definition?: {
        answer?: string;
    };
}
