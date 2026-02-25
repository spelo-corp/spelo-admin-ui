import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import type { PipelineStepDTO } from "../../types/pipeline";

interface StepCardProps {
    step: PipelineStepDTO;
    isConfigOpen: boolean;
    onToggleConfig: () => void;
    onDelete: () => void;
}

export function StepCard({ step, isConfigOpen, onToggleConfig, onDelete }: StepCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: step.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 bg-white border rounded-lg p-3 ${
                isDragging
                    ? "shadow-lg border-brand ring-1 ring-brand/20"
                    : "border-slate-200 shadow-sm"
            } relative`}
        >
            {/* Drag Handle */}
            <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-grab active:cursor-grabbing rounded touch-none"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="w-5 h-5" />
            </button>

            {/* Sequence Badge */}
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full font-semibold text-xs border border-slate-200">
                {step.sequence}
            </div>

            {/* Step Key & Badges */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 truncate">{step.stepKey}</span>
                    {step.isParallel && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 tracking-wide uppercase">
                            Parallel
                        </span>
                    )}
                    {step.failureMode !== "ABORT" && (
                        <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                                step.failureMode === "SKIP"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                            }`}
                        >
                            {step.failureMode}
                        </span>
                    )}
                </div>
                {step.conditionExpression && (
                    <div className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 px-1 py-0.5 text-[10px] rounded text-slate-600 font-medium tracking-tight">
                            if
                        </span>
                        <span className="truncate">{step.conditionExpression}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onToggleConfig}
                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title={isConfigOpen ? "Hide Config" : "Show Config"}
                >
                    {isConfigOpen ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Step"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
