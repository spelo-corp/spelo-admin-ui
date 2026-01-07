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

type LessonListPayload =
    | Lesson[]
    | {
        content?: Lesson[];
        pageNumber?: number;
        page?: number;
        pageSize?: number;
        size?: number;
        totalElements?: number;
        total?: number;
        totalPages?: number;
        last?: boolean;
        lessons?: Lesson[];
    };

async function getLessons(params?: {
    categoryId?: number;
    level?: Lesson["level"];
    page?: number;
    size?: number;
}) {
    const query = new URLSearchParams();
    if (params?.categoryId && params.categoryId > 0) {
        query.set("category_id", String(params.categoryId));
    }
    if (params?.level) query.set("level", params.level);
    if (params?.page) query.set("page", String(params.page));
    if (params?.size) query.set("size", String(params.size));
    const qs = query.toString();

    const response = await handle<{
        status?: string;
        data?: LessonListPayload;
        lessons?: Lesson[];
    }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        })
    );

    const payload: LessonListPayload =
        response.data ?? response.lessons ?? [];
    const success =
        (response as { success?: boolean }).success ??
        (response.status ? response.status === "success" : true);

    if (
        payload &&
        typeof payload === "object" &&
        "content" in payload &&
        Array.isArray(payload.content)
    ) {
        const pageNumber = payload.pageNumber ?? payload.page ?? params?.page ?? 1;
        const pageSize = payload.pageSize ?? payload.size ?? params?.size ?? payload.content.length;
        const totalElements = payload.totalElements ?? payload.total ?? payload.content.length;
        const totalPages =
            payload.totalPages ?? (pageSize ? Math.ceil(totalElements / pageSize) : 1);
        const last = payload.last ?? pageNumber >= totalPages;

        return {
            success,
            lessons: payload.content,
            pageNumber,
            pageSize,
            totalElements,
            totalPages,
            last,
        };
    }

    const lessons = Array.isArray(payload)
        ? payload
        : (payload as { lessons?: Lesson[] }).lessons ?? [];

    return {
        success,
        lessons,
        pageNumber: params?.page ?? 1,
        pageSize: params?.size ?? lessons.length,
        totalElements: lessons.length,
        totalPages: 1,
        last: true,
    };
}

async function getAllLessons(params?: {
    categoryId?: number;
    level?: Lesson["level"];
    size?: number;
}) {
    const pageSize = params?.size ?? 50;
    const first = await getLessons({
        categoryId: params?.categoryId,
        level: params?.level,
        page: 1,
        size: pageSize,
    });

    if (!first.success) {
        return { success: false, lessons: [] as Lesson[] };
    }

    if (first.totalPages <= 1) {
        return { success: true, lessons: first.lessons };
    }

    const remainingPages = Array.from(
        { length: first.totalPages - 1 },
        (_, index) => index + 2
    );

    const pageResponses = await Promise.all(
        remainingPages.map((page) =>
            getLessons({
                categoryId: params?.categoryId,
                level: params?.level,
                page,
                size: pageSize,
            })
        )
    );

    const combinedLessons = [first, ...pageResponses].flatMap((res) =>
        res.success ? res.lessons : []
    );
    const uniqueLessons = Array.from(
        new Map(combinedLessons.map((lesson) => [lesson.id, lesson])).values()
    );

    return {
        success: pageResponses.every((res) => res.success),
        lessons: uniqueLessons,
    };
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

async function translateLesson(lessonId: number) {
    const response = await handle<{ success: boolean; data?: any }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/${lessonId}/translate`, {
            method: "POST",
            headers: getAuthHeaders(),
        })
    );

    return {
        success: response.success ?? true,
        job: response.data ?? null,
    };
}

async function uploadLessonAudio(lessonId: number, file: File, startTime?: number, endTime?: number) {
    const form = new FormData();
    form.append("file", file);
    if (startTime !== undefined) form.append("startTime", String(startTime));
    if (endTime !== undefined) form.append("endTime", String(endTime));

    const response = await handle<{
        success?: boolean;
        code?: number;
        message?: string;
        data?: { audioUrl: string; updatedCount: number };
    }>(
        await fetch(`${BASE_URL_V2}/api/v1/lessons/${lessonId}/audio`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        })
    );

    const success = (response as { success?: boolean }).success ?? true;
    return {
        success,
        audioUrl: response.data?.audioUrl ?? null,
        updatedCount: response.data?.updatedCount ?? 0,
        message: response.message,
    };
}

export const lessonsApi = {
    getLessons,
    getAllLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    updateLessonImage,
    uploadLessonImage,
    uploadLessonAudio,
    resetUserLessonProgress,
    getLessonDetail,
    createListeningLesson,
    updateListeningLesson,
    checkListeningAnswer,
    getNotCompletedListeningLessons,
    getWordDefinition,
    translateLesson,
};
