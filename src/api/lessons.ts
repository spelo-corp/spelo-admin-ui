import {
    BASE_URL_V2,
    getAuthHeaders,
    handle,
} from "./base";
import type {
    Lesson,
    LessonDetail,
    ListeningAnswerDTO,
    ListeningLessonDTO,
    ListeningLessonData,
    ListeningLessonScript,
    VocabWord,
} from "../types";

async function getLessons(params?: { categoryId?: number; level?: Lesson["level"] }) {
    const query = new URLSearchParams();
    if (params?.categoryId !== undefined) query.set("category_id", String(params.categoryId));
    if (params?.level) query.set("level", params.level);
    const qs = query.toString();

    const response = await handle<{ status?: string; data?: Lesson[]; lessons?: Lesson[] }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        })
    );

    const lessons = response.data ?? response.lessons ?? [];
    const success = response.status ? response.status === "success" : true;

    return { success, lessons };
}

async function createLesson(payload: {
    name: string;
    level: Lesson["level"];
    category_id: number;
    image?: string | null;
    gems?: number;
    description?: string | null;
    status?: number;
}) {
    const response = await handle<{ status?: string; data?: Lesson }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        lesson: (response.data as Lesson | undefined) ?? null,
    };
}

async function updateLesson(
    lessonId: number,
    payload: {
        name?: string;
        level?: Lesson["level"];
        category_id?: number;
        status?: number;
        image?: string | null;
        gems?: number;
        description?: string | null;
    }
) {
    const response = await handle<{
        success?: boolean;
        status?: string;
        code?: number;
        message?: string;
        data?: Lesson;
    }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/${lessonId}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );

    return {
        success:
            (response as { success?: boolean }).success ??
            (response.status ? response.status === "success" : true),
        lesson: (response.data as Lesson | undefined) ?? null,
    };
}

async function deleteLesson(lessonId: number) {
    const response = await handle<{
        success?: boolean;
        status?: string;
        code?: number;
        message?: string;
        data?: Lesson;
    }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/${lessonId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        })
    );

    return {
        success:
            (response as { success?: boolean }).success ??
            (response.status ? response.status === "success" : true),
        lesson: (response.data as Lesson | undefined) ?? null,
        message: response.message,
    };
}

async function updateLessonImage(lessonId: number, image: string) {
    const response = await handle<{
        success?: boolean;
        status?: string;
        data?: Lesson;
    }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/${lessonId}/image`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ image }),
        })
    );

    const success =
        (response as { success?: boolean }).success ??
        (response.status ? response.status === "success" : true);

    return {
        success,
        lesson: (response.data as Lesson | undefined) ?? null,
    };
}

async function uploadLessonImage(lessonId: number, file: File) {
    const form = new FormData();
    form.append("file", file);

    const response = await handle<{
        success?: boolean;
        code?: number;
        message?: string;
        data?: Lesson;
    }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/${lessonId}/image/upload`, {
            method: "PATCH",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        })
    );

    const success = (response as { success?: boolean }).success ?? true;
    return {
        success,
        lesson: (response.data as Lesson | undefined) ?? null,
    };
}

async function resetUserLessonProgress(lessonId: number) {
    const response = await handle<{ status?: string; data?: string; message?: string }>(
        await fetch(`${BASE_URL_V2}/api/v1/user_lessons/reset_progress?lesson_id=${lessonId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        message: response.data ?? response.message,
    };
}

async function getLessonDetail(lessonId: number, params?: { page?: number; size?: number }) {
    const query = new URLSearchParams({ lesson_id: String(lessonId) });
    if (params?.page) query.set("page", String(params.page));
    if (params?.size) query.set("size", String(params.size));

    const response = await handle<{ status?: string; data?: LessonDetail }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/listening?${query.toString()}`, {
            headers: getAuthHeaders(),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        lesson: (response.data as LessonDetail | undefined) ?? null,
    };
}

async function createListeningLesson(payload: {
    lesson_id: number;
    lesson_scripts: ListeningLessonScript[];
    original_script: string;
    translated_script: string;
    data: ListeningLessonData;
    type: number;
}) {
    const response = await handle<{ status?: string; data?: ListeningLessonDTO }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/listening`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        data: response.data as ListeningLessonDTO,
    };
}

async function updateListeningLesson(
    listeningLessonId: number,
    payload: {
        lesson_id: number;
        lesson_scripts: ListeningLessonScript[];
        original_script: string;
        translated_script: string;
        data: ListeningLessonData;
        type: number;
    }
) {
    const response = await handle<{ status?: string; data?: ListeningLessonDTO }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/listening/${listeningLessonId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        data: response.data as ListeningLessonDTO,
    };
}

async function checkListeningAnswer(payload: { listening_lesson_id: number; answer: string }) {
    const response = await handle<{ status?: string; data?: ListeningAnswerDTO }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/listening/check_answer`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        data: response.data as ListeningAnswerDTO,
    };
}

async function getNotCompletedListeningLessons(lessonId: number) {
    const response = await handle<{ status?: string; data?: ListeningLessonDTO[] }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/listening/not_completed?lesson_id=${lessonId}`, {
            headers: getAuthHeaders(),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        data: response.data ?? [],
    };
}

async function getWordDefinition(listeningLessonIds: number[]) {
    const ids = Array.from(
        new Set(
            (listeningLessonIds ?? [])
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0)
        )
    );

    if (ids.length === 0) {
        return { success: true, data: {} as Record<string, VocabWord[]> };
    }

    const merged: Record<string, VocabWord[]> = {};
    const chunkSize = 10;

    for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const query = new URLSearchParams();
        chunk.forEach((id) => query.append("listening_lesson_ids", String(id)));

        const response = await handle<{ status?: string; success?: boolean; data?: Record<string, VocabWord[]> }>(
            await fetch(`${BASE_URL_V2}/api/v1/lessons/listening/word_definition?${query.toString()}`, {
                headers: getAuthHeaders(),
            })
        );

        const payload = response.data ?? {};
        Object.entries(payload).forEach(([key, words]) => {
            merged[key] = words ?? [];
        });
    }

    return {
        success: true,
        data: merged,
    };
}

export const lessonsApi = {
    getLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    updateLessonImage,
    uploadLessonImage,
    resetUserLessonProgress,
    getLessonDetail,
    createListeningLesson,
    updateListeningLesson,
    checkListeningAnswer,
    getNotCompletedListeningLessons,
    getWordDefinition,
};
