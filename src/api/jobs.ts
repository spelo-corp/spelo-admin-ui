import type { ProcessingJob, ProcessingJobDetail } from "../types";
import { BASE_URL_V2, handle, getAuthHeaders } from "./base";

async function getProcessingJobs(params?: { page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    const qs = query.toString();
    return handle<{ success: boolean; jobs: ProcessingJob[] }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs${qs ? `?${qs}` : ""}`)
    );
}

async function createProcessingJob(payload: {
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
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    );
}

async function extractSentences(jobId: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs/${jobId}/extract`, {
            method: "POST",
        })
    );
}

async function getJobDetail(jobId: number) {
    return handle<{ success: boolean; job: ProcessingJobDetail }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs/${jobId}`)
    );
}

async function updateSentence(
    jobId: number,
    index: number,
    payload: { text: string; translated_text?: string }
) {
    return handle<{ success: boolean }>(
        await fetch(
            `${BASE_URL_V2}/api/admin/processing-jobs/${jobId}/sentences/${index}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        )
    );
}

async function approveJob(jobId: number, adminUserId: number) {
    return handle<{ success: boolean; listening_lesson_id: number }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs/${jobId}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_user_id: adminUserId }),
        })
    );
}

async function deleteJob(jobId: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs/${jobId}`, {
            method: "DELETE",
        })
    );
}

async function uploadProcessedAudio(jobId: number) {
    return handle<{ success: boolean; upload_task_id: string }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs/${jobId}/upload-audio`, {
            method: "POST",
            headers: getAuthHeaders(),
        })
    );
}

async function getUploadProgress(taskId: string) {
    return handle<{
        success: boolean;
        status: string;
        progress: number;
        message: string;
        uploaded: number;
        total: number;
    }>(
        await fetch(`${BASE_URL_V2}/api/admin/upload-tasks/${taskId}/status`)
    );
}

async function updateSentenceTiming(
    jobId: number,
    index: number,
    start: number,
    end: number
) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs/${jobId}/timing/${index}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ start_time: start, end_time: end })
        })
    );
}

async function updateAllTimings(
    jobId: number,
    payload: { updates: Array<{ index: number; start_time: number; end_time: number }> }
) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL_V2}/api/admin/processing-jobs/${jobId}/timing/batch`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    );
}

export const jobsApi = {
    getProcessingJobs,
    createProcessingJob,
    extractSentences,
    getJobDetail,
    updateSentence,
    approveJob,
    deleteJob,
    uploadProcessedAudio,
    getUploadProgress,
    updateSentenceTiming,
    updateAllTimings,
};
