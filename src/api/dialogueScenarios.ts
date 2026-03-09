import type {
    DialogueCharacter,
    DialogueCharacterRequest,
    DialogueScenarioDTO,
    DialogueScenarioRequest,
} from "../types/dialogueScenario";
import { BASE_URL, getAuthHeaders, handle } from "./base";

async function getDialogueScenarios(category?: string) {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    return handle<{ success: boolean; data: DialogueScenarioDTO[] }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/scenarios${params}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function getDialogueScenario(id: number) {
    return handle<{ success: boolean; data: DialogueScenarioDTO }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/scenarios/${id}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function createDialogueScenario(data: DialogueScenarioRequest) {
    return handle<{ success: boolean; data: DialogueScenarioDTO }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/scenarios`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        }),
    );
}

async function updateDialogueScenario(id: number, data: DialogueScenarioRequest) {
    return handle<{ success: boolean; data: DialogueScenarioDTO }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/scenarios/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        }),
    );
}

async function deleteDialogueScenario(id: number) {
    return handle<{ success: boolean; data: string }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/scenarios/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        }),
    );
}

async function activateDialogueScenario(id: number) {
    return handle<{ success: boolean; data: DialogueScenarioDTO }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/scenarios/${id}/activate`, {
            method: "POST",
            headers: getAuthHeaders(),
        }),
    );
}

async function deactivateDialogueScenario(id: number) {
    return handle<{ success: boolean; data: DialogueScenarioDTO }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/scenarios/${id}/deactivate`, {
            method: "POST",
            headers: getAuthHeaders(),
        }),
    );
}

async function getDialogueCharacters() {
    return handle<{ success: boolean; data: DialogueCharacter[] }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/characters`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function getDialogueCharacter(id: number) {
    return handle<{ success: boolean; data: DialogueCharacter }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/characters/${id}`, {
            headers: getAuthHeaders(),
        }),
    );
}

async function createDialogueCharacter(data: DialogueCharacterRequest) {
    return handle<{ success: boolean; data: DialogueCharacter }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/characters`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        }),
    );
}

async function updateDialogueCharacter(id: number, data: DialogueCharacterRequest) {
    return handle<{ success: boolean; data: DialogueCharacter }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/characters/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        }),
    );
}

async function deleteDialogueCharacter(id: number) {
    return handle<{ success: boolean; data: string }>(
        await fetch(`${BASE_URL}/api/v1/admin/dialogues/characters/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        }),
    );
}

export const dialogueScenariosApi = {
    getDialogueScenarios,
    getDialogueScenario,
    createDialogueScenario,
    updateDialogueScenario,
    deleteDialogueScenario,
    activateDialogueScenario,
    deactivateDialogueScenario,
    getDialogueCharacters,
    getDialogueCharacter,
    createDialogueCharacter,
    updateDialogueCharacter,
    deleteDialogueCharacter,
};
