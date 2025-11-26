import React from "react";
import type { Lesson } from "../../types";
import {
    Eye,
    FileAudio2,
    Pencil,
    CheckCircle,
    CircleSlash,
} from "lucide-react";

interface LessonCardProps {
    lesson: Lesson;
    onView: () => void;
    onAddAudio: () => void;
    onEdit: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
                                                   lesson,
                                                   onView,
                                                   onAddAudio,
                                                   onEdit,
                                               }) => {
    const isActive = lesson.status === 1;

    return (
        <div className="bg-white rounded-card border border-slate-100 shadow-card flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                <h3
                    className="text-sm font-semibold text-slate-900 truncate"
                    title={lesson.name}
                >
                    {lesson.name}
                </h3>

                <span
                    className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
            text-[11px] font-medium
            ${
                        isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                    }
          `}
                >
          {isActive ? (
              <CheckCircle className="w-3 h-3" />
          ) : (
              <CircleSlash className="w-3 h-3" />
          )}
                    {isActive ? "Active" : "Inactive"}
        </span>
            </div>

            {/* BODY */}
            <div className="flex-1 px-4 py-3 text-sm text-slate-600 space-y-2">
                <p>
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Level:
          </span>{" "}
                    {lesson.level}
                </p>

                <p>
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Description:
          </span>{" "}
                    {lesson.description
                        ? lesson.description.length > 100
                            ? lesson.description.slice(0, 100) + "..."
                            : lesson.description
                        : "No description"}
                </p>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                <button
                    onClick={onView}
                    className="
            flex-1 px-2 py-1.5 rounded-full border text-xs font-medium
            text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1
          "
                >
                    <Eye className="w-4 h-4" />
                    View
                </button>

                <button
                    onClick={onAddAudio}
                    className="
            flex-1 px-2 py-1.5 rounded-full border text-xs font-medium
            border-brand text-brand hover:bg-brand-soft
            flex items-center justify-center gap-1
          "
                >
                    <FileAudio2 className="w-4 h-4" />
                    Add Audio
                </button>

                <button
                    onClick={onEdit}
                    className="
            flex-1 px-2 py-1.5 rounded-full border text-xs font-medium
            border-amber-500 text-amber-600 hover:bg-amber-50
            flex items-center justify-center gap-1
          "
                >
                    <Pencil className="w-4 h-4" />
                    Edit
                </button>
            </div>
        </div>
    );
};

export default LessonCard;
