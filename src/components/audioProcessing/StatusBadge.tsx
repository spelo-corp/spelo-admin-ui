import React from "react";
import type { AudioJobStatus } from "../../types/audioProcessing";

interface Props {
    status: AudioJobStatus;
}

const badgeStyles: Record<AudioJobStatus, string> = {
    WAITING_FOR_INPUT: "bg-violet-50 text-violet-700 border border-violet-100",
    READY_TO_PROCESS: "bg-blue-50 text-blue-700 border border-blue-100",
    PROCESSING: "bg-amber-50 text-amber-700 border border-amber-100",
    RUNNING: "bg-amber-50 text-amber-700 border border-amber-100",
    PENDING: "bg-slate-100 text-slate-700 border border-slate-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    FAILED: "bg-rose-50 text-rose-700 border border-rose-100",
    FINALIZED: "bg-blue-50 text-blue-700 border border-blue-100",
    REPROCESSING: "bg-orange-50 text-orange-700 border border-orange-100",
    PARTIAL: "bg-orange-50 text-orange-700 border border-orange-100",
};

const dotStyles: Record<AudioJobStatus, string> = {
    WAITING_FOR_INPUT: "bg-violet-500",
    READY_TO_PROCESS: "bg-blue-500",
    PROCESSING: "bg-amber-500 animate-pulse",
    RUNNING: "bg-amber-500 animate-pulse",
    PENDING: "bg-slate-400",
    COMPLETED: "bg-emerald-500",
    FAILED: "bg-rose-500",
    FINALIZED: "bg-blue-500",
    REPROCESSING: "bg-orange-500 animate-pulse",
    PARTIAL: "bg-orange-500 animate-pulse",
};

export const StatusBadge: React.FC<Props> = ({ status }) => (
    <span
        className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
            uppercase tracking-wide
            ${badgeStyles[status]}
        `}
    >
        <span className={`w-2 h-2 rounded-full ${dotStyles[status]}`} />
        {status.replace("_", " ")}
    </span>
);
