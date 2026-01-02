// src/components/audio/PresignedAudioPlayer.tsx
import React from "react";
import { Loader2 } from "lucide-react";
import { usePresignedAudioUrl } from "../../hooks/usePresignedAudioUrl";

interface Props {
    src: string | null | undefined;
    className?: string;
}

/**
 * Audio player that automatically fetches presigned URLs for MinIO files.
 */
export const PresignedAudioPlayer: React.FC<Props> = ({ src, className = "" }) => {
    const { url, loading } = usePresignedAudioUrl(src);

    if (!src) {
        return (
            <div className="text-xs text-slate-500 italic">
                No audio attached.
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex items-center gap-2 text-sm text-slate-500 ${className}`}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading audio...
            </div>
        );
    }

    if (!url) {
        return (
            <div className="text-xs text-rose-500 italic">
                Failed to load audio.
            </div>
        );
    }

    return (
        <audio
            controls
            src={url}
            className={`w-full rounded-lg bg-slate-50 ${className}`}
        />
    );
};
