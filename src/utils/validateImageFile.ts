const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Unsupported format "${file.type || "unknown"}". Accepted: PNG, JPEG, GIF, WebP.`,
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `File too large (${sizeMB} MB). Maximum allowed: 5 MB.`,
        };
    }

    return { valid: true };
}
