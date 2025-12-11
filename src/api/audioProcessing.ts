import { AUDIO_BASE_URL, JOB_BASE_URL, getAuthHeaders, handle } from "./base";
import type { AudioJob, AudioSentence } from "../types/audioProcessing";

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

function mapSingleJob(job: any): AudioJob {
    const data = job?.data ?? {};
    const lessonId = data.lessonId ?? data.lesson_id ?? job.lessonId ?? job.lesson_id ?? 0;

    return {
        id: Number(job.id ?? data.id ?? 0),
        status: normalizeAudioStatus(job.status),
        lessonId,
        lessonName: data.lessonName ?? data.lesson_name,
        transcript: data.transcript ?? job.transcript ?? "",
        translatedScript: data.translatedScript ?? data.translated_script ?? job.translatedScript,
        type: data.lessonType ?? data.lesson_type ?? job.type,
        audioUrl: data.audioUrl ?? data.audio_url ?? job.audioUrl ?? job.audio_url,
        sentences: data.sentences ?? job.sentences ?? [],
        progressPercent: job.progressPercent ?? data.progressPercent ?? null,
        currentStep: job.currentStep ?? data.currentStep ?? null,
        totalItems: job.totalItems ?? data.totalItems ?? null,
        completedItems: job.completedItems ?? data.completedItems ?? null,
        failedItems: job.failedItems ?? data.failedItems ?? null,
        createdAt: job.createdAt ?? data.createdAt ?? new Date().toISOString(),
        updatedAt: job.updatedAt ?? data.updatedAt ?? job.createdAt ?? new Date().toISOString(),
        finalizedAt: job.completedAt ?? data.completedAt ?? undefined,
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

async function getAudioProcessingJobs(params?: { status?: string; search?: string }) {
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
}

async function getAudioProcessingJob(jobId: number) {
    const res = await handle<{ success?: boolean; data?: any } | any>(
        await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}`, {
            headers: getAuthHeaders(),
        })
    );

    const payload = (res as { data?: any }).data ?? res;
    return mapSingleJob(payload);
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

async function finalizeAudioProcessingJob(jobId: number) {
    return handle<{ success: boolean; data: { id: number; status: string; finalizedAt: string } }>(
        await fetch(`${AUDIO_BASE_URL}/jobs/${jobId}/finalize`, {
            method: "POST",
            headers: getAuthHeaders(),
        })
    );
}

export const audioApi = {
    uploadAudioProcessingAudio,
    uploadAudioProcessingTranscript,
    submitAudioProcessingJob,
    getAudioProcessingJobs,
    getAudioProcessingJob,
    updateAudioProcessingSentences,
    replaceAudioForJob,
    finalizeAudioProcessingJob,
};
