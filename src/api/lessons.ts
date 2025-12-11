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
        name: string;
        level: Lesson["level"];
        category_id: number;
        description?: string | null;
        image?: string | null;
    }
) {
    const response = await handle<{ status?: string; data?: Lesson }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/${lessonId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
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
    const query = new URLSearchParams();
    if (listeningLessonIds.length > 0) {
        query.set("listening_lesson_ids", listeningLessonIds.join(","));
    }

    const response = await handle<{ status?: string; data?: ListeningLessonDTO["new_words"] }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/listening/word_definition?${query.toString()}`, {
            headers: getAuthHeaders(),
        })
    );

    return {
        success: response.status ? response.status === "success" : true,
        data: response.data ?? [],
    };
}

export const lessonsApi = {
    getLessons,
    createLesson,
    updateLesson,
    resetUserLessonProgress,
    getLessonDetail,
    createListeningLesson,
    updateListeningLesson,
    checkListeningAnswer,
    getNotCompletedListeningLessons,
    getWordDefinition,
};
