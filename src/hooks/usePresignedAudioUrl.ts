// src/hooks/usePresignedAudioUrl.ts
import { useState, useEffect } from "react";
import { api } from "../api/client";

/**
 * Hook to fetch a presigned URL for an audio file.
 * @param originalUrl - The original MinIO URL (or null/undefined)
 * @returns { url, loading, error } - The presigned URL, loading state, and any error
 */
export function usePresignedAudioUrl(originalUrl: string | null | undefined) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!originalUrl) {
            setUrl(null);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        api.getPresignedUrlFromMinioUrl(originalUrl)
            .then((result) => {
                if (cancelled) return;
                if (result.success && result.url) {
                    setUrl(result.url);
                } else {
                    console.warn("Failed to get presigned URL, using original:", result.message);
                    setUrl(originalUrl);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("Error fetching presigned URL:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch presigned URL");
                // Fallback to original URL
                setUrl(originalUrl);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [originalUrl]);

    return { url, loading, error };
}

/**
 * Utility function to fetch a presigned URL (for non-hook use cases).
 */
export async function fetchPresignedAudioUrl(originalUrl: string): Promise<string> {
    try {
        const result = await api.getPresignedUrlFromMinioUrl(originalUrl);
        if (result.success && result.url) {
            return result.url;
        }
        // Fallback to original
        return originalUrl;
    } catch (error) {
        console.error("Error fetching presigned URL:", error);
        return originalUrl;
    }
}
