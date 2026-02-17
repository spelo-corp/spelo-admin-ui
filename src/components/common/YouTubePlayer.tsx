import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Loader2 } from "lucide-react";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YouTubePlayerProps {
    videoId: string;
    onReady?: (player: any) => void;
    onStateChange?: (event: any) => void;
    className?: string;
    height?: string | number;
    width?: string | number;
}

export interface YouTubePlayerRef {
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    getCurrentTime: () => number;
    getPlayerState: () => number;
    pauseVideo: () => void;
    playVideo: () => void;
    internalPlayer: any;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
    ({ videoId, onReady, onStateChange, className, height = "360", width = "100%" }, ref) => {
        const playerRef = useRef<any>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const [loading, setLoading] = useState(true);

        useImperativeHandle(ref, () => ({
            seekTo: (seconds: number, allowSeekAhead = true) => {
                playerRef.current?.seekTo(seconds, allowSeekAhead);
            },
            getCurrentTime: () => {
                return playerRef.current?.getCurrentTime() || 0;
            },
            getPlayerState: () => {
                return playerRef.current?.getPlayerState() || -1;
            },
            pauseVideo: () => {
                playerRef.current?.pauseVideo();
            },
            playVideo: () => {
                playerRef.current?.playVideo();
            },
            internalPlayer: playerRef.current,
        }));

        useEffect(() => {
            let player: any;

            const initPlayer = () => {
                if (!window.YT) return;

                player = new window.YT.Player(containerRef.current, {
                    height,
                    width,
                    videoId,
                    playerVars: {
                        playsinline: 1,
                        modestbranding: 1,
                        rel: 0,
                    },
                    events: {
                        onReady: (event: any) => {
                            setLoading(false);
                            playerRef.current = event.target;
                            if (onReady) onReady(event.target);
                        },
                        onStateChange: (event: any) => {
                            if (onStateChange) onStateChange(event);
                        },
                    },
                });
            };

            if (!window.YT) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

                window.onYouTubeIframeAPIReady = () => {
                    initPlayer();
                };
            } else {
                initPlayer();
            }

            return () => {
                if (player && player.destroy) {
                    player.destroy();
                }
            };
        }, [videoId, height, width]); // Re-init if videoId changes

        return (
            <div className={`relative rounded-xl overflow-hidden bg-black ${className}`}>
                <div ref={containerRef} />
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500 z-10">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                )}
            </div>
        );
    }
);

YouTubePlayer.displayName = "YouTubePlayer";
