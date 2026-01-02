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

const AUDIO_BUCKET = "spelo-audio";

/**
 * Get a presigned URL for accessing a file in MinIO storage.
 * @param filename - The filename (key) in the bucket
 * @param bucket - The bucket name (defaults to 'spelo-audio')
 * @returns The presigned URL for direct file access
 */
async function getPresignedUrl(filename: string, bucket: string = AUDIO_BUCKET) {
    const res = await fetch(`${BASE_URL_V2}/api/v1/file/presigned_url/${bucket}/${filename}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    const response = await handle<{ success: boolean; data: string; message?: string; code?: number }>(res);

    return {
        success: response.success,
        url: response.data,
        message: response.message,
    };
}

/**
 * Extract the filename from a MinIO URL.
 * Example: "http://minio:9000/spelo-audio/abc123_audio.mp3" -> "abc123_audio.mp3"
 */
function extractFilenameFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        return pathParts[pathParts.length - 1] || null;
    } catch {
        return null;
    }
}

/**
 * Get a presigned URL from a full MinIO URL.
 * Accepts either a full URL or a plain object key (filename) and fetches a presigned version.
 * @param minioUrl - The original MinIO URL or filename
 * @returns The presigned URL for direct file access
 */
type PresignResult = { success: boolean; url: string | null; message?: string };
const presignedUrlCache = new Map<string, Promise<PresignResult>>();

async function getPresignedUrlFromMinioUrl(minioUrl: string): Promise<PresignResult> {
    const cached = presignedUrlCache.get(minioUrl);
    if (cached) return cached;

    const fetchPromise = (async () => {
        const filename = (() => {
            if (minioUrl.includes("://")) return extractFilenameFromUrl(minioUrl);
            const parts = minioUrl.split('/').filter(Boolean);
            return parts[parts.length - 1] || null;
        })();
        if (!filename) {
            presignedUrlCache.delete(minioUrl);
            return { success: false, url: null, message: "Invalid URL format" };
        }

        try {
            return await getPresignedUrl(filename, AUDIO_BUCKET);
        } catch (error) {
            presignedUrlCache.delete(minioUrl);
            throw error;
        }
    })();

    presignedUrlCache.set(minioUrl, fetchPromise);
    return fetchPromise;
}

export const filesApi = {
    getAudioFiles,
    uploadAudioFile,
    deleteAudioFile,
    uploadLocalTranscript,
    uploadLocalAudio,
    uploadFile,
    getPresignedUrl,
    extractFilenameFromUrl,
    getPresignedUrlFromMinioUrl,
    AUDIO_BUCKET,
};
