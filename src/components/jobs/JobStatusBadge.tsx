import React from "react";
import type { JobStatus } from "../../types";
import {
    Clock,
    Workflow,
    ListChecks,
    Pencil,
    CheckCircle2,
    AlertTriangle,
    FileAudio,
} from "lucide-react";

interface JobStatusBadgeProps {
    status: JobStatus;
}

const statusStyles: Record<JobStatus, string> = {
    pending: "bg-slate-100 text-slate-700",
    extracting: "bg-sky-100 text-sky-700",
    extracted: "bg-indigo-100 text-indigo-700",
    reviewing: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    cancelled: "bg-slate-200 text-slate-700",
    audio_uploaded: "bg-purple-100 text-purple-700",
    uploading_audio: "bg-purple-200 text-purple-700",
};

const statusIcons: Record<JobStatus, React.ComponentType<{ className?: string }>> = {
    pending: Clock,
    extracting: Workflow,
    extracted: ListChecks,
    reviewing: Pencil,
    completed: CheckCircle2,
    failed: AlertTriangle,
    cancelled: AlertTriangle,
    audio_uploaded: FileAudio,
    uploading_audio: FileAudio,
};

const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status }) => {
    const StatusIcon = statusIcons[status] || Clock;
    const statusClass = statusStyles[status] || statusStyles.pending;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusClass}`}
        >
            <StatusIcon className="w-3 h-3" />
            {status}
        </span>
    );
};

export default JobStatusBadge;
