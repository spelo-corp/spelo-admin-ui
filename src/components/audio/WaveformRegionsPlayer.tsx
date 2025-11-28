import React, {useEffect, useRef, useState} from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

interface RegionItem {
    id: string;
    start: number;
    end: number;
    color?: string;
}

interface Props {
    audioUrl: string;
    regions: RegionItem[];
    onRegionUpdate?: (id: string, start: number, end: number) => void;
    onReady?: (ws: WaveSurfer) => void;
    height?: number;
}

export const WaveformRegionsPlayer: React.FC<Props> = ({
                                                           audioUrl,
                                                           regions,
                                                           onRegionUpdate,
                                                           onReady,
                                                           height = 80,
                                                       }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wsRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
    const [zoom, setZoom] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Create Regions plugin instance first
        const regionsPlugin = RegionsPlugin.create();
        regionsPluginRef.current = regionsPlugin;

        const ws = WaveSurfer.create({
            container,
            waveColor: "#cbd5e1",
            progressColor: "#0ea5e9",
            cursorColor: "#334155",
            height,
            plugins: [regionsPlugin], // Pass the plugin instance
        });

        wsRef.current = ws;

        ws.load(audioUrl);

        const handleReady = () => {
            // Clear existing regions using the plugin
            regionsPlugin.clearRegions();

            // Add regions using the plugin
            regions.forEach((r) => {
                const region = regionsPlugin.addRegion({
                    id: r.id,
                    start: r.start,
                    end: r.end,
                    color: r.color || "rgba(14,165,233,0.2)",
                    drag: true,
                    resize: true,
                });

                region.on('update-end', () => {
                    onRegionUpdate?.(region.id, region.start, region.end);
                });
            });

            onReady?.(ws);
        };

        ws.on("ready", handleReady);

        return () => {
            ws.un("ready", handleReady);
            ws.destroy();
        };
    }, [audioUrl, height]);

    useEffect(() => {
        if (!wsRef.current) return;
        wsRef.current.zoom(zoom);
    }, [zoom]);

    // Update regions when the regions prop changes
    useEffect(() => {
        if (!wsRef.current || !regionsPluginRef.current) return;

        // Only update if wavesurfer is ready
        if (wsRef.current.getDuration() > 0) {
            regionsPluginRef.current.clearRegions();

            regions.forEach((r) => {
                const region = regionsPluginRef.current!.addRegion({
                    id: r.id,
                    start: r.start,
                    end: r.end,
                    color: r.color || "rgba(14,165,233,0.2)",
                    drag: true,
                    resize: true,
                });

                region.on('update-end', () => {
                    onRegionUpdate?.(region.id, region.start, region.end);
                });
            });
        }
    }, [regions, onRegionUpdate]);

    return <div ref={containerRef} className="w-full" />;
};