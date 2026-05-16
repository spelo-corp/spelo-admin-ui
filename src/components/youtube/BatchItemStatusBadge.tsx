import type React from "react";
import type { BatchItemStatus } from "../../types/youtube";

interface Props {
    status: BatchItemStatus;
}

const STATUS_CONFIG: Record<
    BatchItemStatus,
    { label: string; className: string; pulse?: boolean }
> = {
    PENDING: {
        label: "Pending",
        className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    LESSON_CREATED: {
        label: "Lesson Created",
        className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    JOB_DISPATCHED: {
        label: "Job Dispatched",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        pulse: true,
    },
    READY_FOR_REVIEW: {
        label: "Ready for Review",
        className: "bg-purple-100 text-purple-700 border-purple-200",
    },
    FINALIZED: {
        label: "Finalized",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    FAILED: {
        label: "Failed",
        className: "bg-rose-100 text-rose-700 border-rose-200",
    },
};

export const BatchItemStatusBadge: React.FC<Props> = ({ status }) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

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
