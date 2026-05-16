import type React from "react";
import type { VideoIngestionStatus } from "../../types/youtube";

interface Props {
    status: VideoIngestionStatus;
}

const STATUS_CONFIG: Record<
    VideoIngestionStatus,
    { label: string; className: string; pulse?: boolean }
> = {
    NEW: {
        label: "New",
        className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    QUEUED: {
        label: "Queued",
        className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    PROCESSING: {
        label: "Processing",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        pulse: true,
    },
    READY_FOR_REVIEW: {
        label: "Ready for Review",
        className: "bg-purple-100 text-purple-700 border-purple-200",
    },
    COMPLETED: {
        label: "Completed",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    FAILED: {
        label: "Failed",
        className: "bg-rose-100 text-rose-700 border-rose-200",
    },
    SKIPPED: {
        label: "Skipped",
        className: "bg-slate-100 text-slate-500 border-slate-200",
    },
    IGNORED: {
        label: "Ignored",
        className: "bg-slate-50 text-slate-400 border-slate-100",
    },
};

export const VideoStatusBadge: React.FC<Props> = ({ status }) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NEW;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
        >
            {config.pulse && (
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
            )}
            {config.label}
        </span>
    );
};
