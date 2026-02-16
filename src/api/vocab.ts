import type { VocabWord } from "../types";
import type {
    AutoCreateVocabRequest,
    ExtractVocabFromLessonRequest,
    ExtractVocabFromLessonResponse,
    MapVocabScriptRequest,
    MapVocabScriptResponse,
    VocabJob,
} from "../types/vocabJob.ts";
import { BASE_URL, getAuthHeaders, handle } from "./base";

function mapJobDetailToVocabJob(payload: any): VocabJob {
    const root = (payload?.data ?? payload ?? {}) as Record<string, any>;
    const detail = (
        root.detail && typeof root.detail === "object"
            ? root.detail
            : root
    ) as Record<string, any>;
    const itemsRaw = Array.isArray(detail.items) ? detail.items : [];

    return {
        id: Number(root.id ?? detail.id ?? 0),
        total_words: detail.total_words ?? detail.totalWords ?? 0,
        completed_words: detail.completed_words ?? detail.completedWords ?? 0,
        failed_words: detail.failed_words ?? detail.failedWords ?? 0,
        status: (root.status ?? detail.status ?? "PENDING") as VocabJob["status"],
        created_at: root.created_at ?? detail.created_at ?? new Date().toISOString(),
        updated_at:
            root.updated_at ??
            detail.updated_at ??
            root.created_at ??
            detail.created_at ??
            new Date().toISOString(),
        items: itemsRaw.map((item: any) => ({
            id: Number(item.id ?? 0),
            word: item.item_key ?? item.word ?? "",
            status: item.status ?? "PENDING",
            error_message: item.error_message ?? item.errorMessage ?? null,
        })),
    };
}

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
        await fetch(`${BASE_URL}/api/v1/vocab?${query.toString()}`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    );
}

async function getVocabById(id: number) {
    return handle<{ success: boolean; data: VocabWord }>(
        await fetch(`${BASE_URL}/api/v1/vocab/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    );
}

async function getVocabByIds(ids: number[]) {
    const query = new URLSearchParams();
    ids.forEach(id => query.append("ids", String(id)));

    await fetch(`${BASE_URL}/api/v1/vocab/ids?${query.toString()}`, {
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
        await fetch(`${BASE_URL}/api/v1/vocab`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function updateVocab(id: number, payload: any) {
    return handle<{ success: boolean; data: any }>(
        await fetch(`${BASE_URL}/api/v1/vocab/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function autoCreateVocab(payload: AutoCreateVocabRequest) {
    return handle<{ success: boolean; data: number }>(
        await fetch(`${BASE_URL}/api/v1/vocab/auto-create`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function getVocabJob(id: number) {
    const res = await handle<{ success?: boolean; data?: any } | any>(
        await fetch(`${BASE_URL}/api/v1/jobs/${id}`, {
            headers: getAuthHeaders(),
        })
    );

    const mapped = mapJobDetailToVocabJob(res);
    const success = (res as { success?: boolean }).success;
    return { success: success ?? true, data: mapped };
}

async function extractVocabFromLesson(lessonId: number, payload?: ExtractVocabFromLessonRequest) {
    const skipStopWords = !(payload?.include_stop_words ?? false);

    const query = new URLSearchParams();
    query.set("skipStopWords", String(skipStopWords));

    return handle<{ success: boolean; data: ExtractVocabFromLessonResponse; message?: string }>(
        await fetch(`${BASE_URL}/api/v1/admin/vocab/extract-from-lesson/${lessonId}?${query.toString()}`, {
            method: "POST",
            headers: getAuthHeaders(),
        })
    );
}

async function mapVocabScriptForLesson(lessonId: number, payload?: MapVocabScriptRequest) {
    const ids = payload?.listening_lesson_ids?.filter((id) => Number.isFinite(id)) ?? [];
    const body = ids.length > 0 ? { listening_lesson_ids: ids } : {};

    return handle<{ success: boolean; data: MapVocabScriptResponse; message?: string }>(
        await fetch(`${BASE_URL}/api/v1/vocab/map-script/${lessonId}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
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
    extractVocabFromLesson,
    mapVocabScriptForLesson,
};
