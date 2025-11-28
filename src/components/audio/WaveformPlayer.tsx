import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface Props {
    audioUrl: string;
    height?: number;
    onReady?: (ws: WaveSurfer) => void;
}

export const WaveformPlayer: React.FC<Props> = ({audioUrl,
                                                    height = 80,
                                                    onReady
                                                }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    const createWaveSurfer = () => {
        if (!containerRef.current) return;

        // destroy old instance if exists
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
        }

        const ws = WaveSurfer.create({
            container: containerRef.current,
            height,
            waveColor: "#cbd5e1",
            progressColor: "#0ea5e9",
            cursorColor: "#0f172a",
            barWidth: 2,
            barGap: 1,
        });

        wavesurferRef.current = ws;
        ws.load(audioUrl);

        ws.on("ready", () => onReady?.(ws));
    };

    useEffect(() => {
        createWaveSurfer();
    }, [audioUrl]);

    // ⭐ RESPONSIVE FIX: recreate waveform whenever container width changes
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            createWaveSurfer();
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            wavesurferRef.current?.destroy();
        };
    }, []);

    return (
        <div className="rounded-md bg-slate-50 border border-slate-200 overflow-hidden">
            <div ref={containerRef} className="w-full" />
        </div>
    );
};
