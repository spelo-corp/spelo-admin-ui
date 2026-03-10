// src/components/audio/PresignedAudioPlayer.tsx

import { Loader2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { usePresignedAudioUrl } from "../../hooks/usePresignedAudioUrl";

interface Props {
    src: string | null | undefined;
    startTime?: number;
    endTime?: number;
    className?: string;
}

/**
 * Audio player that automatically fetches presigned URLs for MinIO files.
 * Supports optional startTime/endTime to play only a segment.
 */
export const PresignedAudioPlayer: React.FC<Props> = ({
    src,
    startTime,
    endTime,
    className = "",
}) => {
    const { url, loading } = usePresignedAudioUrl(src);
    const audioRef = useRef<HTMLAudioElement>(null);
    const hasSegment = startTime !== undefined && endTime !== undefined;

    // Seek to startTime when audio is ready
    const handleLoadedMetadata = useCallback(() => {
        if (hasSegment && audioRef.current) {
            audioRef.current.currentTime = startTime;
        }
    }, [hasSegment, startTime]);

    // Pause at endTime
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !hasSegment) return;

        const handleTimeUpdate = () => {
            if (audio.currentTime >= endTime) {
                audio.pause();
                audio.currentTime = startTime;
            }
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
    }, [hasSegment, startTime, endTime]);

    if (!src) {
        return <div className="text-xs text-slate-500 italic">No audio attached.</div>;
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
        return <div className="text-xs text-rose-500 italic">Failed to load audio.</div>;
    }

    return (
        <audio
            ref={audioRef}
            controls
            src={url}
            onLoadedMetadata={handleLoadedMetadata}
            className={`w-full rounded-lg bg-slate-50 ${className}`}
        />
    );
};
