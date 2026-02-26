import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import { AddStepModal } from "../../components/pipelines/AddStepModal";
import { StepCard } from "../../components/pipelines/StepCard";
import { StepConfigPanel } from "../../components/pipelines/StepConfigPanel";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";
import type { CreatePipelineStepRequest, PipelineDTO, PipelineStepDTO } from "../../types/pipeline";

export default function PipelineEditorPage() {
    const { pipelineId } = useParams<{ pipelineId: string }>();
    const id = Number(pipelineId);

    const [pipeline, setPipeline] = useState<PipelineDTO | null>(null);
    const [steps, setSteps] = useState<PipelineStepDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingMeta, setSavingMeta] = useState(false);

    // UI state
    const [openConfigStepId, setOpenConfigStepId] = useState<number | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const data = await api.getPipeline(id);
                setPipeline(data);
                setSteps(data.steps ? [...data.steps].sort((a, b) => a.sequence - b.sequence) : []);
                setName(data.name || "");
                setDescription(data.description || "");
            } catch (err: unknown) {
                console.error("Failed to load pipeline", err);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [id]);

    const handleSaveMeta = async () => {
        if (!pipeline) return;
        try {
            setSavingMeta(true);
            const data = await api.updatePipeline(pipeline.id, { name, description });
            setPipeline(data);
            alert("Pipeline info updated!");
        } catch (_err) {
            alert("Failed to update pipeline info.");
        } finally {
            setSavingMeta(false);
        }
    };

    const handleAddStep = async (stepKey: string) => {
        if (!pipeline) return;
        try {
            const nextSeq = steps.length > 0 ? Math.max(...steps.map((s) => s.sequence)) + 1 : 1;
            const updatedPipeline = await api.addStep(pipeline.id, {
                stepKey,
                sequence: nextSeq,
                retryCount: 0,
                retryBackoffMs: 1000,
                failureMode: "ABORT",
                skipOnFail: false,
                isParallel: false,
                timeoutMs: null,
                conditionExpression: null,
            });

            // Assume the response contains the new list of steps, or we need to reload
            if (updatedPipeline.steps) {
                setSteps([...updatedPipeline.steps].sort((a, b) => a.sequence - b.sequence));
                // auto-open latest step if we can find it
                const newStep = updatedPipeline.steps.find(
                    (s) => !steps.find((old) => old.id === s.id),
                );
                if (newStep) setOpenConfigStepId(newStep.id);
            }
        } catch (_e) {
            alert("Failed to add step");
        }
    };

    const handleUpdateStep = async (stepId: number, data: CreatePipelineStepRequest) => {
        if (!pipeline) return;
        const updatedPipeline = await api.updateStep(pipeline.id, stepId, data);
        if (updatedPipeline.steps) {
            setSteps([...updatedPipeline.steps].sort((a, b) => a.sequence - b.sequence));
            setOpenConfigStepId(null);
        }
    };

    const handleDeleteStep = async (stepId: number) => {
        if (!pipeline) return;
        if (!window.confirm("Delete this step?")) return;
        try {
            const updatedPipeline = await api.deleteStep(pipeline.id, stepId);
            if (updatedPipeline.steps) {
                setSteps([...updatedPipeline.steps].sort((a, b) => a.sequence - b.sequence));
            } else {
                setSteps((prev) =>
                    prev
                        .filter((s) => s.id !== stepId)
                        .map((s, idx) => ({ ...s, sequence: idx + 1 })),
                );
            }
            if (openConfigStepId === stepId) setOpenConfigStepId(null);
        } catch (_e) {
            alert("Failed to delete step");
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !pipeline) return;

        const oldIndex = steps.findIndex((s) => s.id === active.id);
        const newIndex = steps.findIndex((s) => s.id === over.id);

        // Optimistic UI update
        const newArray = arrayMove(steps, oldIndex, newIndex);
        const resequenced = newArray.map((step, idx) => ({ ...step, sequence: idx + 1 }));
        setSteps(resequenced);

        // Single API call to reorder
        try {
            const orderedIds = resequenced.map((s) => s.id as number);
            const updatedPipeline = await api.reorderSteps(pipeline.id, orderedIds);
            if (updatedPipeline.steps) {
                setSteps([...updatedPipeline.steps].sort((a, b) => a.sequence - b.sequence));
                return;
            }
        } catch (_e) {
            alert("Warning: Failed to persist step order completely. Reloading.");
            // Reset to original payload order
            const data = await api.getPipeline(pipeline.id);
            if (data.steps) setSteps([...data.steps].sort((a, b) => a.sequence - b.sequence));
        }
    };

    if (loading) return <div className="p-8">Loading pipeline...</div>;
    if (!pipeline) return <div className="p-8">Pipeline not found.</div>;

    return (
        <div className="relative overflow-hidden px-8 py-6 max-w-6xl mx-auto">
            <PageHeader
                badge={
                    <Link
                        to="/admin/pipelines"
                        className="text-slate-500 hover:text-brand flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" /> Back to List
                    </Link>
                }
                title={`Editor: ${pipeline.name}`}
                description="Drag steps to reorder. Click a step to configure its execution parameters."
                actions={
                    <Btn.HeroPrimary onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Add Step
                    </Btn.HeroPrimary>
                }
            />

            <div className="flex flex-col lg:flex-row gap-6 mt-6">
                {/* Left Side: Pipeline Steps */}
                <div className="flex-1 space-y-4">
                    <SectionCard title="Execution Steps" tone="soft" className="min-h-[500px]">
                        {steps.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg">
                                <p className="mb-4">No steps configured yet.</p>
                                <Btn.Secondary onClick={() => setIsAddModalOpen(true)}>
                                    Add your first step
                                </Btn.Secondary>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={steps.map((s) => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {steps.map((step) => (
                                            <div key={step.id}>
                                                <StepCard
                                                    step={step}
                                                    isConfigOpen={openConfigStepId === step.id}
                                                    onToggleConfig={() =>
                                                        setOpenConfigStepId(
                                                            openConfigStepId === step.id
                                                                ? null
                                                                : (step.id as number),
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        handleDeleteStep(step.id as number)
                                                    }
                                                />
                                                {openConfigStepId === step.id && (
                                                    <StepConfigPanel
                                                        step={step}
                                                        onSave={handleUpdateStep}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </SectionCard>
                </div>

                {/* Right Side: Meta Info Form */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
                    <SectionCard title="Pipeline Info" tone="default">
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="pipelineId"
                                    className="block text-xs font-medium text-slate-700 mb-1"
                                >
                                    ID
                                </label>
                                <input
                                    id="pipelineId"
                                    disabled
                                    value={pipeline.id}
                                    className="w-full text-sm border-slate-200 bg-slate-50 text-slate-500 rounded-md shadow-sm"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="pipelineJobType"
                                    className="block text-xs font-medium text-slate-700 mb-1"
                                >
                                    Job Type
                                </label>
                                <input
                                    id="pipelineJobType"
                                    disabled
                                    value={pipeline.jobType}
                                    className="w-full text-sm border-slate-200 bg-slate-50 text-slate-500 rounded-md shadow-sm"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="pipelineName"
                                    className="block text-xs font-medium text-slate-700 mb-1"
                                >
                                    Name
                                </label>
                                <Input
                                    id="pipelineName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full text-sm"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="pipelineDesc"
                                    className="block text-xs font-medium text-slate-700 mb-1"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="pipelineDesc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full block border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 sm:text-sm"
                                    rows={3}
                                />
                            </div>
                            <Btn.Primary
                                onClick={handleSaveMeta}
                                disabled={savingMeta}
                                className="w-full justify-center"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Btn.Primary>
                        </div>
                    </SectionCard>
                </div>
            </div>

            <AddStepModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddStep}
            />
        </div>
    );
}
