import type { AudioFile } from "../types";
import { BASE_URL_V2, getAuthHeaders, handle } from "./base";

async function getAudioFiles() {
    return handle<{ success: boolean; files: AudioFile[] }>(
        await fetch(`${BASE_URL_V2}/api/admin/audio-files`, {
            headers: getAuthHeaders(),
        })
    );
}

async function uploadAudioFile(payload: {
    url: string;
    file_name: string;
    lesson_id?: number;
    duration?: number;
}) {
    return handle<{ success: boolean; file: AudioFile }>(
        await fetch(`${BASE_URL_V2}/api/admin/audio-files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    );
}

async function deleteAudioFile(id: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL_V2}/api/admin/audio-files/${id}`, {
            method: "DELETE",
        })
    );
}

// Legacy local uploads (kept for compatibility with older flows)
async function uploadLocalTranscript(file: File, lessonId: number) {
    const form = new FormData();
    form.append("file", file);
    form.append("lesson_id", lessonId.toString());

    const headers = getAuthHeaders({ contentType: null });
    const res = await fetch(`${BASE_URL_V2}/api/upload-local/transcript`, {
        method: "POST",
        headers,
        body: form,
    });

    return handle<{ success: boolean; file_path: string }>(res);
}

async function uploadLocalAudio(file: File, lessonId: number) {
    const form = new FormData();
    form.append("file", file);
    form.append("lesson_id", lessonId.toString());

    const headers = getAuthHeaders({ contentType: null });
    const res = await fetch(`${BASE_URL_V2}/api/upload-local/audio`, {
        method: "POST",
        headers,
        body: form,
    });

    return handle<{ success: boolean; file_path: string }>(res);
}

async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${BASE_URL_V2}/api/v1/file/upload`, {
        method: "POST",
        headers: getAuthHeaders({ contentType: null }),
        body: form,
    });

    return handle<{ success?: boolean; data?: string; message?: string; code?: number }>(res);
}

export const filesApi = {
    getAudioFiles,
    uploadAudioFile,
    deleteAudioFile,
    uploadLocalTranscript,
    uploadLocalAudio,
    uploadFile,
};
