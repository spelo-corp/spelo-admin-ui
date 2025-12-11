import type { VocabWord } from "../types";
import type { AutoCreateVocabRequest, VocabJob } from "../types/vocabJob.ts";
import { BASE_URL_V2, getAuthHeaders, handle } from "./base";

async function getVocab(params?: { q?: string; page?: number; size?: number }) {
    const query = new URLSearchParams();

    if (params?.q) query.set("q", params.q);
    if (params?.page) query.set("page", String(params.page));
    if (params?.size) query.set("size", String(params.size));

    return handle<{
        success: boolean;
        data: VocabWord[];
        total: number;
        message?: string;
        code?: number;
    }>(
        await fetch(`${BASE_URL_V2}/api/v1/vocab?${query.toString()}`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    );
}

async function getVocabById(id: number) {
    return handle<{ success: boolean; data: VocabWord }>(
        await fetch(`${BASE_URL_V2}/api/v1/vocab/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    );
}

async function getVocabByIds(ids: number[]) {
    const query = new URLSearchParams();
    ids.forEach(id => query.append("ids", String(id)));

    await fetch(`${BASE_URL_V2}/api/v1/vocab/ids?${query.toString()}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
}

async function createVocab(payload: {
    word: string;
    phonetic?: string;
    meaningVi?: string;
    meaningEn?: string;
    level?: string;
}) {
    return handle<{ success: boolean; data: VocabWord }>(
        await fetch(`${BASE_URL_V2}/api/v1/vocab`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function updateVocab(id: number, payload: any) {
    return handle<{ success: boolean; data: any }>(
        await fetch(`${BASE_URL_V2}/api/v1/vocab/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function autoCreateVocab(payload: AutoCreateVocabRequest) {
    return handle<{ success: boolean; data: number }>(
        await fetch(`${BASE_URL_V2}/api/v1/vocab/auto-create`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function getVocabJob(id: number) {
    return handle<{ success: boolean; data: VocabJob }>(
        await fetch(`${BASE_URL_V2}/api/v1/vocab/jobs/${id}`, {
            headers: getAuthHeaders(),
        })
    );
}

export const vocabApi = {
    getVocab,
    getVocabById,
    getVocabByIds,
    createVocab,
    updateVocab,
    autoCreateVocab,
    getVocabJob,
};
