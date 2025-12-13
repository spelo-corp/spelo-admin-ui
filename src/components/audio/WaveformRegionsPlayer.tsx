import React, { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { ZoomIn, ZoomOut, RefreshCw, AlertTriangle } from "lucide-react";

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

const isAbortError = (error: unknown): boolean => {
    if (!error) return false;

    if (error instanceof DOMException) {
        return error.name === "AbortError";
    }

    if (error instanceof Error) {
        return error.name === "AbortError" || /aborted/i.test(error.message);
    }

    if (typeof error === "object" && error !== null && "name" in error) {
        return (error as { name?: unknown }).name === "AbortError";
    }

    return false;
};

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
    editable?: boolean;
}

export const WaveformRegionsPlayer: React.FC<Props> = ({
                                                           audioUrl,
                                                           regions,
                                                           onRegionUpdate,
                                                           onReady,
                                                           height = 80,
                                                           editable = true,
                                                       }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const wsRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);

    // Track regions internally to avoid unnecessary recreations
    const internalRegionsRef = useRef<Map<string, any>>(new Map());
    const isUpdatingRegionRef = useRef(false);
    const editableRef = useRef(editable);

    const [zoom, setZoom] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        editableRef.current = editable;
    }, [editable]);

    // Initialize WaveSurfer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);
        setError(null);

        try {
            // Create Regions plugin
            const regionsPlugin = RegionsPlugin.create();
            regionsPluginRef.current = regionsPlugin;

            const ws = WaveSurfer.create({
                container,
                waveColor: "#cbd5e1",
                progressColor: "#0ea5e9",
                cursorColor: "#334155",
                cursorWidth: 2,
                height,
                plugins: [regionsPlugin],
                normalize: true,
                minPxPerSec: 50,
                interact: true,
            });

            wsRef.current = ws;

            // Event handlers
            const handleError = (error: unknown) => {
                if (wsRef.current !== ws) return;
                if (isAbortError(error)) return;

                console.error("WaveSurfer error:", error);
                setError(`Audio error: ${getErrorMessage(error)}`);
                setIsLoading(false);
            };

            const handleLoad = () => {
                if (wsRef.current !== ws) return;
                setIsLoading(true);
            };

            const handleReady = () => {
                if (wsRef.current !== ws) return;
                setIsLoading(false);

                // Add initial regions
                regions.forEach((regionConfig) => {
                    const region = regionsPlugin.addRegion({
                        id: regionConfig.id,
                        start: regionConfig.start,
                        end: regionConfig.end,
                        color: regionConfig.color || "rgba(14,165,233,0.3)",
                        drag: editable,
                        resize: editable,
                        minLength: 0.1,
                    });

                    // Store region internally
                    internalRegionsRef.current.set(regionConfig.id, region);

                    // Only update parent when user is done interacting
                    region.on("update-end", () => {
                        if (!editableRef.current) return;
                        if (!isUpdatingRegionRef.current) {
                            isUpdatingRegionRef.current = true;
                            onRegionUpdate?.(region.id, region.start, region.end);
                            // Reset flag after a short delay
                            setTimeout(() => {
                                isUpdatingRegionRef.current = false;
                            }, 100);
                        }
                    });
                });

                onReady?.(ws);
            };

            // Subscribe to events
            ws.on("error", handleError);
            ws.on("load", handleLoad);
            ws.on("ready", handleReady);

            // Cleanup function
            return () => {
                ws.un("error", handleError);
                ws.un("load", handleLoad);
                ws.un("ready", handleReady);
                wsRef.current = null;
                try {
                    const result = ws.destroy() as unknown;
                    if (result && typeof (result as { catch?: unknown }).catch === "function") {
                        (result as Promise<unknown>).catch(() => undefined);
                    }
                } catch {
                    // ignore cleanup errors
                }
                internalRegionsRef.current.clear();
            };

        } catch (err: unknown) {
            console.error("Failed to initialize WaveSurfer:", err);
            setError(`Initialization failed: ${getErrorMessage(err)}`);
            setIsLoading(false);
        }
    }, []); // Empty dependency array - runs only once

    // Handle audio URL changes
    useEffect(() => {
        const ws = wsRef.current;
        if (!ws) return;

        // Only reload if we have a valid WaveSurfer instance
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);
        setError(null);
        try {
            const result = ws.load(audioUrl) as unknown;
            if (result && typeof (result as { catch?: unknown }).catch === "function") {
                (result as Promise<unknown>).catch((err: unknown) => {
                    if (wsRef.current !== ws) return;
                    if (isAbortError(err)) return;
                    console.error("Failed to load audio:", err);
                    setError(`Failed to load audio: ${getErrorMessage(err)}`);
                    setIsLoading(false);
                });
            }
        } catch (err: unknown) {
            if (!isAbortError(err)) {
                console.error("Failed to load audio:", err);
                setError(`Failed to load audio: ${getErrorMessage(err)}`);
                setIsLoading(false);
            }
        }
    }, [audioUrl]);

    // Smart region updates - only update when necessary
    useEffect(() => {
        if (!regionsPluginRef.current || isLoading || isUpdatingRegionRef.current) {
            return;
        }

        const currentRegions = internalRegionsRef.current;
        const newRegionIds = new Set(regions.map(r => r.id));

        try {
            // Remove regions that are no longer in the props
            for (const [id, region] of currentRegions) {
                if (!newRegionIds.has(id)) {
                    region.remove();
                    currentRegions.delete(id);
                }
            }

            // Update or add regions
            regions.forEach(regionConfig => {
                const existingRegion = currentRegions.get(regionConfig.id);

                if (existingRegion) {
                    existingRegion.setOptions({
                        start: regionConfig.start,
                        end: regionConfig.end,
                        color: regionConfig.color || "rgba(14,165,233,0.3)",
                        drag: editable,
                        resize: editable,
                    });
                } else {
                    // Add new region
                    const region = regionsPluginRef.current!.addRegion({
                        id: regionConfig.id,
                        start: regionConfig.start,
                        end: regionConfig.end,
                        color: regionConfig.color || "rgba(14,165,233,0.3)",
                        drag: editable,
                        resize: editable,
                        minLength: 0.1,
                    });

                    currentRegions.set(regionConfig.id, region);

                    region.on("update-end", () => {
                        if (!editableRef.current) return;
                        if (!isUpdatingRegionRef.current) {
                            isUpdatingRegionRef.current = true;
                            onRegionUpdate?.(region.id, region.start, region.end);
                            setTimeout(() => {
                                isUpdatingRegionRef.current = false;
                            }, 100);
                        }
                    });
                }
            });
        } catch (err: unknown) {
            console.error("Failed to update regions:", err);
        }
    }, [regions, isLoading, editable, onRegionUpdate]);

    // Apply zoom
    const applyZoom = useCallback(() => {
        if (!wsRef.current || isLoading) return;
        try {
            const minPxPerSec = 50 + zoom;
            wsRef.current.setOptions({ minPxPerSec });
        } catch (err: unknown) {
            console.error("Failed to apply zoom:", getErrorMessage(err));
        }
    }, [zoom, isLoading]);

    useEffect(() => {
        applyZoom();
    }, [applyZoom]);

    // Zoom handlers
    const handleZoomIn = useCallback(() => {
        setZoom((z) => Math.min(z + 20, 600));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((z) => Math.max(z - 20, 0)); // Fixed: don't allow negative zoom
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoom(0);
    }, []);

    // Retry handler
    const handleRetry = useCallback(() => {
        setError(null);
        setIsLoading(true);
        internalRegionsRef.current.clear();

        if (wsRef.current) {
            try {
                const result = wsRef.current.destroy() as unknown;
                if (result && typeof (result as { catch?: unknown }).catch === "function") {
                    (result as Promise<unknown>).catch(() => undefined);
                }
            } catch {
                // ignore cleanup errors
            }
            wsRef.current = null;
        }
        regionsPluginRef.current = null;

        // Reinitialize after a brief delay
        setTimeout(() => {
            const container = containerRef.current;
            if (!container) return;

            try {
                const regionsPlugin = RegionsPlugin.create();
                regionsPluginRef.current = regionsPlugin;

                const ws = WaveSurfer.create({
                    container,
                    waveColor: "#cbd5e1",
                    progressColor: "#0ea5e9",
                    cursorColor: "#334155",
                    cursorWidth: 2,
                    height,
                    plugins: [regionsPlugin],
                    normalize: true,
                    minPxPerSec: 50,
                    interact: true,
                });

                wsRef.current = ws;

                ws.on("ready", () => {
                    if (wsRef.current !== ws) return;
                    setIsLoading(false);
                    onReady?.(ws);
                });

                ws.on("error", (error: unknown) => {
                    if (wsRef.current !== ws) return;
                    if (isAbortError(error)) return;
                    setError(`Audio error: ${getErrorMessage(error)}`);
                    setIsLoading(false);
                });

                try {
                    const result = ws.load(audioUrl) as unknown;
                    if (result && typeof (result as { catch?: unknown }).catch === "function") {
                        (result as Promise<unknown>).catch((err: unknown) => {
                            if (wsRef.current !== ws) return;
                            if (isAbortError(err)) return;
                            setError(`Audio error: ${getErrorMessage(err)}`);
                            setIsLoading(false);
                        });
                    }
                } catch (err: unknown) {
                    if (!isAbortError(err)) {
                        setError(`Audio error: ${getErrorMessage(err)}`);
                        setIsLoading(false);
                    }
                }
            } catch (err: unknown) {
                setError(`Initialization failed: ${getErrorMessage(err)}`);
                setIsLoading(false);
            }
        }, 100);
    }, [audioUrl, height, onReady]);

    // Error display
    if (error) {
        return (
            <div className="space-y-3">
                <div className="p-4 border border-rose-300 bg-rose-50 rounded-xl text-rose-700 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Error loading audio</span>
                    </div>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm self-start"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleZoomIn}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>

                <button
                    onClick={handleZoomOut}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>

                <button
                    onClick={handleResetZoom}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>

                <span className="text-xs text-slate-500">
                    {isLoading ? "Loading..." : `Zoom: ${zoom}px/sec`}
                </span>
            </div>

            {/* Waveform Container */}
            <div className="relative">
                <div
                    ref={containerRef}
                    className="w-full bg-slate-50 rounded-md border border-slate-200 overflow-hidden"
                    style={{ height: `${height}px` }}
                />

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-100 bg-opacity-80 flex items-center justify-center rounded-md">
                        <div className="flex items-center gap-2 text-slate-600">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading audio...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
