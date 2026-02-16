import type { ProcessingJob, ProcessingJobDetail } from "../types";
import type { JobDetailResponse } from "../types/jobService";
import { BASE_URL, handle, getAuthHeaders } from "./base";

// Get jobs from /api/v1/jobs with optional filtering
async function getJobs(params?: {
    page?: number;
    size?: number;
    lesson_id?: number;
    job_type?: string;
    status?: string;
}) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.size) query.set("size", String(params.size));
    if (params?.lesson_id) query.set("lesson_id", String(params.lesson_id));
    if (params?.job_type) query.set("job_type", params.job_type);
    if (params?.status) query.set("status", params.status);

    const qs = query.toString();

    return handle<{ success: boolean; code: number; message: string; data: ProcessingJob[]; total: number; page: number; size: number }>(
        await fetch(`${BASE_URL}/api/v1/jobs${qs ? `?${qs}` : ""}`, {
            headers: getAuthHeaders(),
        })
    );
}

async function getJobServiceDetail<TDetail = unknown>(jobId: number) {
    return handle<JobDetailResponse<TDetail>>(
        await fetch(`${BASE_URL}/api/v1/jobs/${jobId}`, {
            headers: getAuthHeaders(),
        })
    );
}

// Legacy function name for backward compatibility
async function getProcessingJobs(params?: { page?: number; per_page?: number; lesson_id?: number }) {
    return getJobs({
        page: params?.page,
        size: params?.per_page,
        lesson_id: params?.lesson_id,
        job_type: "AUDIO_ALIGN",
    });
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
        await fetch(`${BASE_URL}/api/admin/processing-jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    );
}

async function extractSentences(jobId: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/extract`, {
            method: "POST",
        })
    );
}

async function getJobDetail(jobId: number) {
    return handle<{ success: boolean; job: ProcessingJobDetail }>(
        await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}`)
    );
}

async function updateSentence(
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
}

async function approveJob(jobId: number, adminUserId: number) {
    return handle<{ success: boolean; listening_lesson_id: number }>(
        await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_user_id: adminUserId }),
        })
    );
}

async function deleteJob(jobId: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}`, {
            method: "DELETE",
        })
    );
}

async function uploadProcessedAudio(jobId: number) {
    return handle<{ success: boolean; upload_task_id: string }>(
        await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/upload-audio`, {
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
        await fetch(`${BASE_URL}/api/admin/upload-tasks/${taskId}/status`)
    );
}

async function updateSentenceTiming(
    jobId: number,
    index: number,
    start: number,
    end: number
) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/timing/${index}`, {
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
        await fetch(`${BASE_URL}/api/admin/processing-jobs/${jobId}/timing/batch`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    );
}

export const jobsApi = {
    getJobs,
    getJobServiceDetail,
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
