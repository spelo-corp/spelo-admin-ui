import { useEffect, useState } from "react";
import { filesApi } from "../api/files";

const IMAGE_BUCKET = "spelo-images";

/**
 * Hook to resolve a MinIO object key (stored in DB) to a presigned URL.
 * @param objectKey - The image object key (e.g. "lesson_42_full.webp") or null
 * @param bucket - The bucket name (defaults to "spelo-images")
 * @returns The presigned URL or null while loading
 */
export function usePresignedImageUrl(
    objectKey: string | null | undefined,
    bucket: string = IMAGE_BUCKET,
): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!objectKey) {
            setUrl(null);
            return;
        }

        // If it's already a full URL (http/https/data), use it directly
        if (objectKey.startsWith("http://") || objectKey.startsWith("https://") || objectKey.startsWith("data:")) {
            setUrl(objectKey);
            return;
        }

        let cancelled = false;
        filesApi
            .getPresignedUrl(objectKey, bucket)
            .then((res) => {
                if (!cancelled && res.success && res.url) {
                    setUrl(res.url);
                }
            })
            .catch(() => {
                // Silently fail — image just won't show
            });

        return () => {
            cancelled = true;
        };
    }, [objectKey, bucket]);

    return url;
}
