import type {
    DashboardStats,
    Lesson,
    ProcessingJob,
    ProcessingJobDetail,
    AudioFile, LessonDetail, VocabWord,
} from "../types";
import type { AutoCreateVocabRequest, VocabJob } from "../types/vocabJob.ts";
import type { AudioJob, AudioSentence } from "../types/audioProcessing";

const BASE_URL = "http://localhost:8081";
const BASE_URL_V2 = "https://209848bcdc01.ngrok-free.app";
const JOB_BASE_URL = "http://localhost:8080";
const AUDIO_BASE_URL = `${BASE_URL_V2}/api/v1/audio-processing`;

function getAuthHeaders(options?: { contentType?: string | null }) {
    const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJuZXVsYWFuaDE1QGdtYWlsLmNvbSIsImlhdCI6MTc2NDE0NDQ0NywiZXhwIjoyNjI4MTQ0NDQ3LCJzY3AiOiIiLCJpZCI6MX0.aU4NpOFI5HVNd925-MUeNu8X6s7s6TPt583gjsB_zsLI_hhzzIhsWlSnHpJy-PtCED9HGL6tmK0RLe0NwQdPxA"; // or sessionStorage

    const headers: Record<string, string> = {
        Authorization: token ? `Bearer ${token}` : "",
    };

    const contentType = options?.contentType;
    if (contentType !== null) {
        headers["Content-Type"] = contentType ?? "application/json";
    }

    return headers;
}

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
    }
    return await res.json() as Promise<T>;
}

type RawJob = {
    id: number;
    jobType?: string;
    job_type?: string;
    status?: string;
    totalItems?: number;
    total_items?: number;
    completedItems?: number;
    completed_items?: number;
    failedItems?: number;
    failed_items?: number;
    progressPercent?: number | null;
    progress_percent?: number | null;
    currentStep?: string | null;
    current_step?: string | null;
    inputPayload?: unknown;
    input_payload?: unknown;
    resultPayload?: unknown;
    result_payload?: unknown;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
    completedAt?: string | null;
    completed_at?: string | null;
};

function safeParseJson<T = any>(value: unknown): T | null {
    if (!value) return null;
    if (typeof value === "object") return value as T;
    if (typeof value === "string") {
        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    }
    return null;
}

const normalizeAudioStatus = (status?: string): AudioJob["status"] => {
    if (!status) return "PROCESSING";
    const upper = status.toUpperCase();
    if (upper === "RUNNING") return "PROCESSING";
    if (upper === "PENDING") return "PROCESSING";
    if (upper === "COMPLETED") return "COMPLETED";
    if (upper === "FAILED") return "FAILED";
    if (upper === "FINALIZED") return "FINALIZED";
    if (upper === "PARTIAL") return "PARTIAL";
    if (upper === "REPROCESSING") return "REPROCESSING";
    if (upper === "PROCESSING") return "PROCESSING";
    return "PROCESSING";
};

function mapRawJobToAudioJob(raw: RawJob): AudioJob | null {
    const input = safeParseJson(raw.inputPayload ?? raw.input_payload);
    const resultWrapper = safeParseJson<{ data?: any }>(raw.resultPayload ?? raw.result_payload);
    const resultData = resultWrapper?.data ?? resultWrapper ?? null;

    const merged = {
        ...(input as Record<string, any> | null ?? {}),
        ...(resultData as Record<string, any> | null ?? {}),
    };

    const createdAt = raw.createdAt ?? raw.created_at ?? "";
    const updatedAt = raw.updatedAt ?? raw.updated_at ?? createdAt;
    const completedAt = raw.completedAt ?? raw.completed_at ?? undefined;

    const lessonId = merged.lessonId ?? merged.lesson_id ?? 0;

    return {
        id: Number(raw.id),
        status: normalizeAudioStatus(raw.status),
        lessonId,
        lessonName: merged.lessonName ?? merged.lesson_name ?? undefined,
        transcript: merged.transcript ?? "",
        translatedScript: merged.translatedScript ?? merged.translated_script ?? undefined,
        type: merged.lessonType ?? merged.lesson_type ?? undefined,
        audioUrl: merged.audioUrl ?? merged.audio_url ?? undefined,
        sentences: merged.sentences ?? [],
        progressPercent: raw.progressPercent ?? raw.progress_percent ?? null,
        currentStep: raw.currentStep ?? raw.current_step ?? null,
        totalItems: raw.totalItems ?? raw.total_items ?? null,
        completedItems: raw.completedItems ?? raw.completed_items ?? null,
        failedItems: raw.failedItems ?? raw.failed_items ?? null,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || createdAt || new Date().toISOString(),
        finalizedAt: completedAt ?? undefined,
    };
}

export const api = {
    async getDashboardStats() {
        return handle<{ success: boolean; stats: DashboardStats }>(
            await fetch(`${BASE_URL}/api/admin/dashboard/stats`)
        );
    },

    async getProcessingJobs(params?: { page?: number; per_page?: number }) {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.per_page) query.set("per_page", String(params.per_page));
        const qs = query.toString();
        return handle<{ success: boolean; jobs: ProcessingJob[] }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs${qs ? `?${qs}` : ""}`)
        );
    },

    async getLessons() {
        return handle<{ success: boolean; lessons: Lesson[] }>(
            await fetch(`${BASE_URL}/api/admin/lessons`)
        );
    },

    async createLesson(payload: {
        name: string;
        level: string;
        category_id: number;
        description?: string | null;
        image?: string | null;
    }) {
        return handle<{ success: boolean; lesson: Lesson }>(
            await fetch(`${BASE_URL}/api/admin/lessons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
        );
    },

    async createProcessingJob(payload: {
        lesson_id: number;
        audio_url: string;
        transcript_text?: string;
        transcript_file_name?: string;
        transcript_url?: string;
        start_time: number;
        end_time: number;
        type: number;
    }) {
        return handle<{ success: boolean; job: ProcessingJob }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
        );
    },

    async extractSentences(jobId: number) {
        return handle<{ success: boolean }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/extract`, {
                method: "POST",
            })
        );
    },

    async getJobDetail(jobId: number) {
        return handle<{ success: boolean; job: ProcessingJobDetail }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}`)
        );
    },

    async updateSentence(
        jobId: number,
        index: number,
        payload: { text: string; translated_text?: string }
    ) {
        return handle<{ success: boolean }>(
            await fetch(
                `${BASE_URL}/api/admin/processing-jobs/${jobId}/sentences/${index}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            )
        );
    },

    async approveJob(jobId: number, adminUserId: number) {
        return handle<{ success: boolean; listening_lesson_id: number }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ admin_user_id: adminUserId }),
            })
        );
    },

    async deleteJob(jobId: number) {
        return handle<{ success: boolean }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}`, {
                method: "DELETE",
            })
        );
    },

    // 🔊 AUDIO FILES API
    async getAudioFiles() {
        return handle<{ success: boolean; files: AudioFile[] }>(
            await fetch(`${BASE_URL}/api/admin/audio-files`)
        );
    },

    async uploadAudioFile(payload: {
        url: string;
        file_name: string;
        lesson_id?: number;
        duration?: number;
    }) {
        return handle<{ success: boolean; file: AudioFile }>(
            await fetch(`${BASE_URL}/api/admin/audio-files`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
        );
    },

    async deleteAudioFile(id: number) {
        return handle<{ success: boolean }>(
            await fetch(`${BASE_URL}/api/admin/audio-files/${id}`, {
                method: "DELETE",
            })
        );
    },

    async uploadLocalTranscript(file: File, lessonId: number) {
        const form = new FormData();
        form.append("file", file);
        form.append("lesson_id", lessonId.toString());

        const res = await fetch(`${BASE_URL}/api/upload-local/transcript`, {
            method: "POST",
            body: form,
        });

        return handle<{ success: boolean; file_path: string }>(res);
    },


    async uploadLocalAudio(file: File, lessonId: number) {
        const form = new FormData();
        form.append("file", file);
        form.append("lesson_id", lessonId.toString());

        const res = await fetch(`${BASE_URL}/api/upload-local/audio`, {
            method: "POST",
            body: form,
        });

        return handle<{ success: boolean; file_path: string }>(res);
    },

    async uploadProcessedAudio(jobId: number) {
        return handle<{ success: boolean; upload_task_id: string }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/upload-audio`, {
                method: "POST",
            })
        );
    },

    async getUploadProgress(taskId: string) {
        return handle<{
            success: boolean;
            status: string;     // "queued" | "uploading" | "completed" | "failed"
            progress: number;   // % 0–100
            message: string;
            uploaded: number;
            total: number;// "Uploading to R2..."
        }>(
            await fetch(`${BASE_URL}/api/admin/upload-tasks/${taskId}/status`)
        );
    },

    async getLessonDetail(lessonId: number) {
        return handle<{ success: boolean; lesson: LessonDetail }>(
            await fetch(`${BASE_URL}/api/admin/lessons/${lessonId}`)
        );
    },

    async updateSentenceTiming(
        jobId: number,
        index: number,
        start: number,
        end: number
    ) {
        return handle<{ success: boolean }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/timing/${index}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start_time: start, end_time: end })
            })
        );
    },

    async updateAllTimings(
        jobId: number,
        payload: { updates: Array<{ index: number; start_time: number; end_time: number }> }
    ) {
        return handle<{ success: boolean }>(
            await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/timing/batch`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
        );
    },

    async syncLesson(lessonId: number) {
        return handle<{ success: boolean; message?: string }>(
            await fetch(`${BASE_URL}/api/admin/sync/lesson/${lessonId}`, {
                method: "POST",
            })
        );
    },

    async updateLesson(
        lessonId: number,
        payload: {
            name: string;
            level: string;
            category_id: number;
            description?: string | null;
            image?: string | null;
        }
    ) {
        return handle<{ success: boolean; lesson: LessonDetail }>(
            await fetch(`${BASE_URL}/api/admin/lessons/${lessonId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
        );
    },

    // 🎧 AUDIO PROCESSING V2 (Lesson Audio)
    async submitAudioProcessingJob(payload: {
        file: File;
        transcript: string;
        lessonId: number;
        translatedScript?: string;
        type?: number;
    }) {
        const form = new FormData();
        form.append("file", payload.file);
        form.append("transcript", payload.transcript);
        form.append("lesson_id", String(payload.lessonId));
        if (payload.translatedScript) form.append("translated_script", payload.translatedScript);
        if (payload.type !== undefined) form.append("type", String(payload.type));

        return handle<{ success: boolean; data: { jobId: number; status: string; createdAt: string } }>(
            await fetch(`${AUDIO_BASE_URL}`, {
                method: "POST",
                headers: getAuthHeaders({ contentType: null }),
                body: form,
            })
        );
    },

    async getAudioProcessingJobs(params?: { status?: string; search?: string }) {
        const query = new URLSearchParams();
        query.set("job_type", "AUDIO_PROCESSING");
        if (params?.status) query.set("status", params.status);
        if (params?.search) query.set("search", params.search);

        const response = await handle<any>(
            await fetch(`${JOB_BASE_URL}/api/v1/jobs?${query.toString()}`, {
                headers: getAuthHeaders(),
            })
        );

        const payload =
            (response as { data?: RawJob[] }).data ??
            (response as { jobs?: RawJob[] }).jobs ??
            (Array.isArray(response) ? response : []);

        return (payload as RawJob[])
            .map(mapRawJobToAudioJob)
            .filter(Boolean) as AudioJob[];
    },

    async getAudioProcessingJob(jobId: number) {
        return handle<{ success: boolean; data: AudioJob }>(
            await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}`, {
                headers: getAuthHeaders(),
            })
        );
    },

    async updateAudioProcessingSentences(jobId: number, sentences: AudioSentence[]) {
        return handle<{ success: boolean }>(
            await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/sentences`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ sentences }),
            })
        );
    },

    async replaceAudioForJob(jobId: number, file: File) {
        const form = new FormData();
        form.append("file", file);

        return handle<{ success: boolean }>(
            await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/audio`, {
                method: "PUT",
                headers: getAuthHeaders({ contentType: null }),
                body: form,
            })
        );
    },

    async finalizeAudioProcessingJob(jobId: number) {
        return handle<{ success: boolean; data: { id: number; status: string; finalizedAt: string } }>(
            await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/finalize`, {
                method: "POST",
                headers: getAuthHeaders(),
            })
        );
    },

    async getVocab(params?: { q?: string; page?: number; size?: number }) {
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
    },

    async getVocabById(id: number) {
        return handle<{ success: boolean; data: VocabWord }>(
            await fetch(`${BASE_URL_V2}/api/v1/vocab/${id}`, {
                method: "GET",
                headers: getAuthHeaders(),
            })
        );
    },

    async getVocabByIds(ids: number[]) {
        const query = new URLSearchParams();
        ids.forEach(id => query.append("ids", String(id)));

        await fetch(`${BASE_URL_V2}/api/v1/vocab/ids?${query.toString()}`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    },

    async createVocab(payload: {
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
    },

    async updateVocab(id: number, payload: any) {
        return handle<{ success: boolean; data: any }>(
            await fetch(`${BASE_URL_V2}/api/v1/vocab/${id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            })
        );
    },

    async autoCreateVocab(payload: AutoCreateVocabRequest) {
        return handle<{ success: boolean; data: number }>(
            await fetch(`${BASE_URL_V2}/api/v1/vocab/auto-create`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            })
        );
    },

    async getVocabJob(id: number) {
        return handle<{ success: boolean; data: VocabJob }>(
            await fetch(`${BASE_URL_V2}/api/v1/vocab/jobs/${id}`, {
                headers: getAuthHeaders(),
            })
        );
    }
};
