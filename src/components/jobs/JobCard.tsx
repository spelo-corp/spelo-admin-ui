// src/components/jobs/JobCard.tsx
import React from "react";
import type { ProcessingJob } from "../../types";
import { Link, useNavigate } from "react-router-dom";
import {
    FileAudio,
    Trash2,
    Pencil,
    PlayCircle,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Workflow,
    ListChecks,
    VideoIcon,
} from "lucide-react";

interface JobCardProps {
    job: ProcessingJob;
    onExtract: () => void;
    onDelete: () => void;
    onApprove: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onExtract, onDelete, onApprove }) => {
    const navigate = useNavigate();
    const progress = job.progress_percent ?? 0;

    const statusStyles: Record<string, string> = {
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

    const currentStatus = job.current_step || "pending";

    const StatusIcon =
        {
            pending: Clock,
            extracting: Workflow,
            extracted: ListChecks,
            reviewing: Pencil,
            completed: CheckCircle2,
            failed: AlertTriangle,
            cancelled: AlertTriangle,
            audio_uploaded: FileAudio,
            uploading_audio: FileAudio,
        }[currentStatus] || Clock;

    const handleViewUploadProgress = () => {
        if (!job.upload_task_id) return;
        navigate(`/admin/upload-tasks/${job.upload_task_id}`);
    };

    return (
        <div
            className="
                group relative bg-white rounded-card border border-slate-100 shadow-card
                p-5 flex flex-col gap-4
            "
        >
            {/* STATUS BADGE */}
            <span
                className={`
                    absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px]
                    font-medium shadow-sm flex items-center gap-1
                    transition-all duration-200
                    ${statusStyles[currentStatus] || statusStyles["pending"]}
                `}
            >
                <StatusIcon className="w-3 h-3" />
                <span
                    className="
                        hidden group-hover:inline
                        whitespace-nowrap
                        transition-all duration-200
                    "
                >
                    {currentStatus}
                </span>
            </span>

            {/* HEADER */}
            <div className="flex flex-col pr-8">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {job.lesson_name || `Lesson ${job.lesson_id}`}
                </h3>
                <p className="text-[11px] text-slate-500">Job #{job.id}</p>
            </div>

            {/* AUDIO URL */}
            <div className="flex items-start gap-2 text-xs text-slate-600">
                <FileAudio className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span
                    className="
                        line-clamp-2
                        min-h-[32px]
                        break-all
                        leading-snug
                        block
                    "
                >
                    {job.original_audio_url}
                </span>
            </div>

            {/* PROGRESS BAR */}
            <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full bg-brand transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* CREATED DATE */}
            <p className="text-[11px] text-slate-500">
                Created: {new Date(job.created_at).toLocaleString()}
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-2">
                {/* Extract */}
                {currentStatus === "pending" && (
                    <button
                        onClick={onExtract}
                        className="flex-1 px-3 py-2 rounded-full bg-brand text-white text-xs
                                   flex items-center justify-center gap-1 hover:bg-brand-dark"
                    >
                        <PlayCircle className="w-4 h-4" /> Extract
                    </button>
                )}

                {/* Review */}
                {(currentStatus === "extracted" || currentStatus === "reviewing") && (
                    <Link
                        to={`/admin/processing-jobs/${job.id}/review`}
                        className="flex-1 px-3 py-2 rounded-full bg-amber-500 text-white text-xs
                                   flex items-center justify-center gap-1 hover:bg-amber-600"
                    >
                        <Pencil className="w-4 h-4" /> Review
                    </Link>
                )}

                {/* 🔵 Uploading Progress -> navigate to page */}
                {currentStatus === "uploading_audio" && job.upload_task_id && (
                    <button
                        onClick={handleViewUploadProgress}
                        className="flex-1 px-3 py-2 rounded-full bg-emerald-500 text-white text-xs
                                   flex items-center justify-center gap-1 hover:bg-emerald-600"
                    >
                        <VideoIcon className="w-4 h-4" /> Uploading Progress
                    </button>
                )}

                {/* Approve (after audio uploaded) */}
                {currentStatus === "audio_uploaded" && (
                    <button
                        onClick={onApprove}
                        className="flex-1 px-3 py-2 rounded-full bg-emerald-500 text-white text-xs
                                   flex items-center justify-center gap-1 hover:bg-emerald-600"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                )}

                {/* Completed */}
                {currentStatus === "completed" && (
                    <div className="flex-1 px-3 py-2 rounded-full bg-emerald-50 text-emerald-700
                                    flex items-center justify-center gap-1 text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                    </div>
                )}

                {/* Delete */}
                <button
                    onClick={onDelete}
                    className="ml-auto px-3 py-2 rounded-full border border-rose-200 text-rose-600 text-xs
                               flex items-center justify-center hover:bg-rose-50"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default JobCard;
