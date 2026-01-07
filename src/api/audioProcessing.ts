import { AUDIO_BASE_URL, JOB_BASE_URL, getAuthHeaders, handle } from "./base";
import type { AudioJob, AudioSentence } from "../types/audioProcessing";
import type { JobListItemDTO, JobServiceStatus } from "../types/jobService";

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
    if (upper === "WAITING_FOR_INPUT") return "WAITING_FOR_INPUT";
    if (upper === "READY_TO_PROCESS") return "READY_TO_PROCESS";
    if (upper === "RUNNING") return "PROCESSING";
    if (upper === "PENDING") return "PENDING";
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

function mapSingleJob(job: any): AudioJob {
    const root = (job?.data ?? job?.job ?? job ?? {}) as Record<string, any>;
    const detail = (
        root.detail && typeof root.detail === "object"
            ? root.detail
            : root.data && typeof root.data === "object"
                ? root.data
                : root
    ) as Record<string, any>;
    const lessonId =
        detail.lessonId ??
        detail.lesson_id ??
        root.lessonId ??
        root.lesson_id ??
        0;

    return {
        id: Number(root.id ?? detail.id ?? 0),
        status: normalizeAudioStatus(root.status ?? detail.status),
        lessonId,
        lessonName: detail.lessonName ?? detail.lesson_name ?? root.lessonName ?? root.lesson_name,
        transcript: detail.transcript ?? root.transcript ?? "",
        translatedScript: detail.translatedScript ?? detail.translated_script ?? root.translatedScript,
        type: detail.type ?? detail.lessonType ?? detail.lesson_type ?? root.type,
        audioUrl: detail.audioUrl ?? detail.audio_url ?? root.audioUrl ?? root.audio_url,
        sentences: detail.sentences ?? root.sentences ?? [],
        progressPercent: root.progressPercent ?? root.progress_percent ?? detail.progressPercent ?? detail.progress_percent ?? null,
        currentStep: root.currentStep ?? root.current_step ?? detail.currentStep ?? detail.current_step ?? null,
        totalItems: root.totalItems ?? root.total_items ?? detail.totalItems ?? detail.total_items ?? null,
        completedItems: root.completedItems ?? root.completed_items ?? detail.completedItems ?? detail.completed_items ?? null,
        failedItems: root.failedItems ?? root.failed_items ?? detail.failedItems ?? detail.failed_items ?? null,
        createdAt: root.createdAt ?? root.created_at ?? detail.createdAt ?? detail.created_at ?? new Date().toISOString(),
        updatedAt:
            root.updatedAt ??
            root.updated_at ??
            detail.updatedAt ??
            detail.updated_at ??
            root.createdAt ??
            root.created_at ??
            new Date().toISOString(),
        finalizedAt: detail.finalizedAt ?? detail.finalized_at ?? root.completedAt ?? root.completed_at ?? undefined,
    };
}

async function uploadAudioProcessingAudio(payload: {
    file: File;
    lessonId: number;
}) {
    const form = new FormData();
    form.append("file", payload.file);

    return handle<{ success: boolean; data?: { jobId?: number; audioUrl?: string }; jobId?: number }>(
        await fetch(`${AUDIO_BASE_URL}/upload-audio/${payload.lessonId}`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        })
    );
}

async function uploadAudioProcessingTranscript(payload: {
    jobId: number;
    transcript: string;
    translatedScript?: string;
}) {
    const body: Record<string, unknown> = {
        jobId: payload.jobId,
        transcript: payload.transcript,
    };
    if (payload.translatedScript) body.translatedScript = payload.translatedScript;

    return handle<{ success: boolean; data?: any }>(
        await fetch(`${AUDIO_BASE_URL}/upload-transcript`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        })
    );
}

async function submitAudioProcessingJob(payload: {
    file: File;
    transcript: string;
    lessonId: number;
    translatedScript?: string;
    type?: number;
    startTime?: number;
    endTime?: number;
}) {
    const audioRes = await uploadAudioProcessingAudio({
        file: payload.file,
        lessonId: payload.lessonId,
    });

    const jobId =
        (audioRes as { data?: { jobId?: number } }).data?.jobId ??
        (audioRes as { jobId?: number }).jobId;

    if (!jobId) throw new Error("Audio upload did not return a job ID.");

    await uploadAudioProcessingTranscript({
        jobId,
        transcript: payload.transcript,
        translatedScript: payload.translatedScript,
    });

    return { jobId };
}

async function getAudioProcessingJobs(params?: {
    status?: string;
    search?: string;
    lessonId?: number;
    page?: number;
    size?: number;
}) {
    const query = new URLSearchParams();
    query.set("job_type", "AUDIO_ALIGN");
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.lessonId) query.set("lesson_id", String(params.lessonId));
    if (params?.page) query.set("page", String(params.page));
    if (params?.size) query.set("size", String(params.size));

    const response = await handle<any>(
        await fetch(`${JOB_BASE_URL}/api/v1/jobs?${query.toString()}`, {
            headers: getAuthHeaders(),
        })
    );

    // Handle paginated response
    const data = (response as { data?: any }).data ?? response;

    // If it's a paginated response with content array
    if (data && typeof data === "object" && "content" in data && Array.isArray(data.content)) {
        const jobs = (data.content as RawJob[])
            .map(mapRawJobToAudioJob)
            .filter(Boolean) as AudioJob[];

        return {
            content: jobs,
            pageNumber: data.pageNumber ?? data.page ?? 1,
            pageSize: data.pageSize ?? data.size ?? 20,
            totalElements: data.totalElements ?? data.total ?? jobs.length,
            totalPages: data.totalPages ?? 1,
            last: data.last ?? true,
        };
    }

    // Fallback for non-paginated responses (backward compatibility)
    const payload = Array.isArray(data) ? data : (data.jobs ?? []);
    const jobs = (payload as RawJob[])
        .map(mapRawJobToAudioJob)
        .filter(Boolean) as AudioJob[];

    return {
        content: jobs,
        pageNumber: 1,
        pageSize: jobs.length,
        totalElements: jobs.length,
        totalPages: 1,
        last: true,
    };
}

async function getAudioProcessingJob(jobId: number) {
    const res = await handle<{ success?: boolean; data?: any } | any>(
        await fetch(`${JOB_BASE_URL}/api/v1/jobs/${jobId}`, {
            headers: getAuthHeaders(),
        })
    );

    return mapSingleJob(res);
}

async function updateAudioProcessingSentences(jobId: number, sentences: AudioSentence[]) {
    return handle<{ success: boolean }>(
        await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/sentences`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ sentences }),
        })
    );
}

async function replaceAudioForJob(jobId: number, file: File) {
    const form = new FormData();
    form.append("file", file);

    return handle<{ success: boolean }>(
        await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/audio`, {
            method: "PUT",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        })
    );
}

async function editAudioJob(jobId: number, segments: { start: number; end: number }[]) {
    return handle<{ success: boolean; data?: any }>(
        await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/edit`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ segments }),
        })
    );
}

async function submitExistingAudioProcessingJob(jobId: number) {
    return handle<{ success?: boolean; data?: any }>(
        await fetch(`${AUDIO_BASE_URL}/${jobId}/submit`, {
            method: "POST",
            headers: getAuthHeaders(),
        })
    );
}

async function finalizeAudioProcessingJob(jobId: number) {
    return handle<{ success?: boolean; data?: any; message?: string }>(
        await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/finalize`, {
            method: "POST",
            headers: getAuthHeaders(),
        })
    );
}

async function updateJobStatus(
    jobId: number,
    payload: { status: JobServiceStatus; reason?: string }
) {
    const body: Record<string, unknown> = { status: payload.status };
    if (payload.reason !== undefined) body.reason = payload.reason;

    const res = await handle<{ data?: JobListItemDTO } | JobListItemDTO>(
        await fetch(`${JOB_BASE_URL}/api/v1/jobs/${jobId}/status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        })
    );

    return (res as { data?: JobListItemDTO }).data ?? (res as JobListItemDTO);
}

export const audioApi = {
    uploadAudioProcessingAudio,
    uploadAudioProcessingTranscript,
    submitAudioProcessingJob,
    getAudioProcessingJobs,
    getAudioProcessingJob,
    updateAudioProcessingSentences,
    replaceAudioForJob,
    editAudioJob,
    submitExistingAudioProcessingJob,
    finalizeAudioProcessingJob,
    updateJobStatus,
};
