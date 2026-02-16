import type { AudioFile } from "../types";
import { BASE_URL, getAuthHeaders, handle } from "./base";

const AUDIO_BUCKET = "spelo-audio";

async function getAudioFiles() {
    return handle<{ success: boolean; files: AudioFile[] }>(
        await fetch(`${BASE_URL}/api/admin/audio-files`, {
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
        await fetch(`${BASE_URL}/api/admin/audio-files`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    );
}

async function deleteAudioFile(id: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL}/api/admin/audio-files/${id}`, {
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
    const res = await fetch(`${BASE_URL}/api/upload-local/transcript`, {
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
    const res = await fetch(`${BASE_URL}/api/upload-local/audio`, {
        method: "POST",
        headers,
        body: form,
    });

    return handle<{ success: boolean; file_path: string }>(res);
}

async function uploadFile(file: File, bucketName: string = AUDIO_BUCKET) {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${BASE_URL}/api/v1/file/${bucketName}/upload`, {
        method: "POST",
        headers: getAuthHeaders({ contentType: null }),
        body: form,
    });

    return handle<{ success?: boolean; data?: string; message?: string; code?: number }>(res);
}

/**
 * Get a presigned URL for accessing a file in MinIO storage.
 * @param filename - The filename (key) in the bucket
 * @param bucket - The bucket name (defaults to 'spelo-audio')
 * @returns The presigned URL for direct file access
 */
async function getPresignedUrl(filename: string, bucket: string = AUDIO_BUCKET) {
    const res = await fetch(`${BASE_URL}/api/v1/file/presigned_url/${bucket}/${filename}`, {
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
        const parsed = (() => {
            if (minioUrl.includes("://")) {
                const url = new URL(minioUrl);
                const parts = url.pathname.split("/").filter(Boolean);
                const bucket = parts.length > 1 ? parts[0] : AUDIO_BUCKET;
                const filename = parts[parts.length - 1] || null;
                return { bucket, filename };
            }
            const parts = minioUrl.split("/").filter(Boolean);
            if (parts.length >= 2) {
                return { bucket: parts[0], filename: parts[parts.length - 1] || null };
            }
            return { bucket: AUDIO_BUCKET, filename: parts[parts.length - 1] || null };
        })();
        const filename = parsed.filename;
        if (!filename) {
            presignedUrlCache.delete(minioUrl);
            return { success: false, url: null, message: "Invalid URL format" };
        }

        try {
            return await getPresignedUrl(filename, parsed.bucket);
        } catch (error) {
            presignedUrlCache.delete(minioUrl);
            throw error;
        }
    })();

    presignedUrlCache.set(minioUrl, fetchPromise);
    return fetchPromise;
}

async function replaceFile(bucketName: string, objectName: string, file: File) {
    const form = new FormData();
    form.append("bucketName", bucketName);
    form.append("objectName", objectName);
    form.append("file", file);

    return handle<{ success: boolean; data?: any }>(
        await fetch(`${BASE_URL}/api/v1/file/replace`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: null }),
            body: form,
        })
    );
}

async function trimAudio(bucketName: string, objectName: string, segments: { start: number; end: number }[]) {
    return handle<{ success: boolean; data?: any }>(
        await fetch(`${BASE_URL}/api/v1/file/audio/trim`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                bucket_name: bucketName,
                object_name: objectName,
                segments,
            }),
        })
    );
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
    replaceFile,
    trimAudio,
    AUDIO_BUCKET,
};
