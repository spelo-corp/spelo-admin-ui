import React from "react";
import type {ProcessingJob} from "../../types";
import { Link } from "react-router-dom";

interface JobCardProps {
    job: ProcessingJob;
    onExtract: () => void;
    onDelete: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onExtract, onDelete }) => {
    const progress = job.progress_percent ?? 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-slate-100 text-slate-700";
            case "extracting":
                return "bg-sky-100 text-sky-700";
            case "extracted":
                return "bg-indigo-100 text-indigo-700";
            case "reviewing":
                return "bg-amber-100 text-amber-700";
            case "completed":
                return "bg-emerald-100 text-emerald-700";
            case "failed":
                return "bg-rose-100 text-rose-700";
            case "cancelled":
                return "bg-slate-200 text-slate-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {job.lesson_name || `Lesson ${job.lesson_id}`}
                </h3>
                <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(
                        job.current_step
                    )}`}
                >
          {job.current_step}
        </span>
            </div>
            <div className="px-4 py-3 text-sm text-slate-600 flex-1">
                <p className="break-all text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Audio URL:</span>{" "}
                    {job.original_audio_url}
                </p>
                <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full bg-speloPurple transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 flex justify-between">
          <span>
            Created: {new Date(job.created_at).toLocaleString()}
          </span>
                    <span>Job #{job.id}</span>
                </p>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                {job.current_step === "pending" && (
                    <button
                        className="flex-1 px-2 py-1.5 rounded-xl bg-speloPurple text-white text-xs hover:bg-speloPurpleDark"
                        onClick={onExtract}
                    >
                        ⚡ Extract Sentences
                    </button>
                )}
                {(job.current_step === "extracted" ||
                    job.current_step === "reviewing") && (
                    <Link
                        to={`/admin/processing-jobs/${job.id}/review`}
                        className="flex-1 px-2 py-1.5 rounded-xl bg-amber-500 text-white text-xs text-center hover:bg-amber-600"
                    >
                        ✏️ Review Sentences
                    </Link>
                )}
                {job.current_step === "completed" && (
                    <span className="flex-1 px-2 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs text-center">
            ✅ Completed
          </span>
                )}
                <button
                    className="px-2 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs hover:bg-rose-50"
                    onClick={onDelete}
                >
                    🗑
                </button>
            </div>
        </div>
    );
};

export default JobCard;
