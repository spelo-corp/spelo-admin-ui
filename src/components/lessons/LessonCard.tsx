import React from "react";
import type { Lesson } from "../../types";
import {
    Eye,
    FileAudio2,
    Pencil,
    CheckCircle,
    CircleSlash,
    Trash2,
    Sparkles,
    Award,
} from "lucide-react";

interface LessonCardProps {
    lesson: Lesson;
    onView: () => void;
    onAddAudio: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
    lesson,
    onView,
    onAddAudio,
    onEdit,
    onDelete,
}) => {
    const isActive = lesson.status === 1;

    // Get solid color based on lesson level for variety
    const getLevelColor = (level: string) => {
        const colors: Record<string, string> = {
            A1: "bg-emerald-100",
            A2: "bg-teal-100",
            B1: "bg-green-100",
            B2: "bg-emerald-200",
            C1: "bg-teal-200",
            C2: "bg-green-200",
        };
        return colors[level] || "bg-emerald-100";
    };

    return (
        <div className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
            {/* DECORATIVE BACKGROUND */}
            <div className="absolute inset-0 bg-emerald-50/30 group-hover:bg-emerald-50/50 transition-opacity duration-300" />

            {/* IMAGE/SOLID COLOR HEADER */}
            <div className="relative h-36 overflow-hidden">
                {lesson.image ? (
                    <>
                        <img
                            src={lesson.image}
                            alt={lesson.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </>
                ) : (
                    <div className={`w-full h-full ${getLevelColor(lesson.level)} relative overflow-hidden`}>
                        {/* Subtle pattern overlay */}
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/40" />
                            <div className="absolute bottom-6 left-6 w-20 h-20 rounded-full bg-white/40" />
                        </div>
                    </div>
                )}

                {/* STATUS BADGE - Floating on image */}
                <div className="absolute top-3 right-3">
                    <div
                        className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                            text-xs font-semibold backdrop-blur-md border
                            ${isActive
                                ? "bg-emerald-500/90 text-white border-emerald-300/50 shadow-lg shadow-emerald-500/25"
                                : "bg-slate-800/80 text-slate-200 border-slate-600/50"
                            }
                        `}
                    >
                        {isActive ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                            <CircleSlash className="w-3.5 h-3.5" />
                        )}
                        {isActive ? "Active" : "Inactive"}
                    </div>
                </div>

                {/* LEVEL BADGE - Floating on image */}
                <div className="absolute top-3 left-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-slate-800 border border-white/50 shadow-lg">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {lesson.level}
                    </div>
                </div>

                {/* GEMS BADGE - if exists */}
                {lesson.gems && lesson.gems > 0 ? (
                    <div className="absolute bottom-3 right-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/95 backdrop-blur-md text-xs font-bold text-amber-900 border border-amber-300/50 shadow-lg">
                            <Sparkles className="w-3.5 h-3.5" />
                            {lesson.gems}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* CONTENT SECTION */}
            <div className="relative flex-1 px-5 py-4 space-y-3">
                {/* Title */}
                <h3
                    className="text-base font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-all duration-300"
                    title={lesson.name}
                >
                    {lesson.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {lesson.description && lesson.description.trim()
                        ? lesson.description
                        : "No description available for this lesson."}
                </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="relative px-4 pb-4 pt-2 flex gap-2">
                {/* Primary View Button */}
                <button
                    onClick={onView}
                    className="
                        flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm
                        bg-emerald-500 text-white shadow-md hover:shadow-xl
                        hover:bg-emerald-600
                        transform hover:scale-[1.02] active:scale-[0.98]
                        transition-all duration-200
                        flex items-center justify-center gap-2
                    "
                >
                    <Eye className="w-4 h-4" />
                    View
                </button>

                {/* Secondary Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onAddAudio}
                        className="
                            p-2.5 rounded-xl border-2 border-brand/30 text-brand 
                            hover:bg-brand hover:text-white hover:border-brand
                            transform hover:scale-110 active:scale-95
                            transition-all duration-200 shadow-sm hover:shadow-md
                        "
                        title="Add Audio"
                    >
                        <FileAudio2 className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onEdit}
                        className="
                            p-2.5 rounded-xl border-2 border-amber-400/30 text-amber-600 
                            hover:bg-amber-500 hover:text-white hover:border-amber-500
                            transform hover:scale-110 active:scale-95
                            transition-all duration-200 shadow-sm hover:shadow-md
                        "
                        title="Edit"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onDelete}
                        className="
                            p-2.5 rounded-xl border-2 border-rose-400/30 text-rose-600 
                            hover:bg-rose-500 hover:text-white hover:border-rose-500
                            transform hover:scale-110 active:scale-95
                            transition-all duration-200 shadow-sm hover:shadow-md
                        "
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonCard;
