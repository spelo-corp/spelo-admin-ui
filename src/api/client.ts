import type {
    DashboardStats,
    Lesson,
    ProcessingJob,
    ProcessingJobDetail,
    AudioFile,
} from "../types";

const BASE_URL = "http://localhost:8081";

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
    }
    return await res.json() as Promise<T>;
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

};
