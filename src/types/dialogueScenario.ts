export interface DialogueScenarioDTO {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    ai_name: string;
    ai_role: string;
    character_id: number;
    setting: string;
    context_data: string | null;
    checkpoints: string;
    target_vocab: string | null;
    target_grammar: string | null;
    suggested_responses: string | null;
    opening_line: string | null;
    max_turns: number;
    estimated_minutes: number;
    icon_url: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface DialogueScenarioRequest {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    character_id: number;
    setting: string;
    context_data?: string | null;
    checkpoints: string;
    target_vocab?: string | null;
    target_grammar?: string | null;
    suggested_responses?: string | null;
    opening_line?: string | null;
    max_turns: number;
    estimated_minutes: number;
    icon_url?: string | null;
    is_active?: boolean;
    sort_order?: number;
}

export interface DialogueCharacter {
    id: number;
    name: string;
    role: string;
    personality: string;
    speech_style: string;
    catchphrases: string | null;
    habits: string | null;
    avatar_url: string | null;
    is_active: boolean;
}

export interface DialogueCharacterRequest {
    name: string;
    role: string;
    personality: string;
    speech_style: string;
    catchphrases?: string | null;
    habits?: string | null;
    avatar_url?: string | null;
    is_active?: boolean;
}
