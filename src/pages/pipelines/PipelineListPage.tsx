import {
    GitFork,
    Loader2,
    Pause,
    Play,
    PlusCircle,
    RefreshCcw,
    Search,
    Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import PageHeader from "../../components/common/PageHeader";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";
import { JOB_TYPES, type JobType, type PipelineDTO } from "../../types/pipeline";

type TypeFilter = "ALL" | JobType;

const badgeColors: Record<string, string> = {
    AUDIO_ALIGN: "bg-blue-100 text-blue-700",
    YOUTUBE_ALIGN: "bg-red-100 text-red-700",
    VOCAB_ENRICH: "bg-purple-100 text-purple-700",
    VOCAB_EXTRACT: "bg-purple-100 text-purple-700",
    VOCAB_SCRIPT_MAP: "bg-purple-100 text-purple-700",
    LESSON_TRANSLATE: "bg-green-100 text-green-700",
    AI_SCORING: "bg-amber-100 text-amber-700",
    UPLOAD_TO_R2: "bg-cyan-100 text-cyan-700",
    COLLECTION_GENERATE: "bg-teal-100 text-teal-700",
};

const PipelineListPage: React.FC = () => {
    const [pipelines, setPipelines] = useState<PipelineDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
    const [search, setSearch] = useState("");

    // Create Form State
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newJobType, setNewJobType] = useState<JobType>(JOB_TYPES[0]);

    const loadPipelines = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.listPipelines();
            setPipelines(data || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load pipelines.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPipelines();
    }, [loadPipelines]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPipelines();
        setRefreshing(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newJobType) return;

        try {
            setIsCreating(true);
            const created = await api.createPipeline({
                name: newName.trim(),
                description: newDesc.trim() || undefined,
                jobType: newJobType,
            });
            setPipelines((prev) => [created, ...prev]);
            setNewName("");
            setNewDesc("");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to create pipeline");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this pipeline?")) return;
        try {
            await api.deletePipeline(id);
            setPipelines((prev) => prev.filter((p) => p.id !== id));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to delete pipeline");
        }
    };

    const handleActivate = async (id: number) => {
        try {
            await api.activatePipeline(id);
            await loadPipelines();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to activate pipeline");
        }
    };

    const handleDeactivate = async (id: number) => {
        try {
            await api.deactivatePipeline(id);
            await loadPipelines();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to deactivate pipeline");
        }
    };

    // Calculate unique job types present in the data for filtering
    const availableJobTypes = useMemo(() => {
        const set = new Set(pipelines.map((p) => p.jobType));
        return ["ALL", ...Array.from(set).sort()] as TypeFilter[];
    }, [pipelines]);

    const filteredPipelines = useMemo(() => {
        const term = search.trim().toLowerCase();
        return pipelines.filter((p) => {
            const matchesType = typeFilter === "ALL" || p.jobType === typeFilter;
            const matchesSearch =
                !term ||
                String(p.id).includes(term) ||
                p.name?.toLowerCase().includes(term) ||
                p.jobType.toLowerCase().includes(term);
            return matchesType && matchesSearch;
        });
    }, [pipelines, search, typeFilter]);

    return (
        <div className="relative overflow-hidden px-8 py-6">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -left-28 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
                <div className="absolute top-20 right-[-90px] h-80 w-80 rounded-full bg-gradient-to-br from-brand/25 via-brand/10 to-transparent blur-3xl" />
                <div className="absolute bottom-[-120px] left-10 h-72 w-72 rounded-full bg-gradient-to-tr from-brand/18 via-transparent to-transparent blur-3xl" />
            </div>

            <div className="space-y-8 relative">
                <PageHeader
                    badge={
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                            Pipelines
                        </div>
                    }
                    title="Pipeline Engine"
                    description="Manage and configure background job execution steps."
                    actions={
                        <>
                            <Btn.HeroSecondary onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCcw
                                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Btn.HeroSecondary>
                        </>
                    }
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                            <div className="text-[11px] uppercase tracking-wide text-white/70">
                                Total Pipelines
                            </div>
                            <div className="text-2xl font-semibold">{pipelines.length}</div>
                        </div>
                        <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                            <div className="text-[11px] uppercase tracking-wide text-white/70">
                                Active
                            </div>
                            <div className="text-2xl font-semibold">
                                {pipelines.filter((p) => p.isActive).length}
                            </div>
                        </div>
                    </div>
                </PageHeader>

                {/* Create Form */}
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-5">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-brand" />
                        Create New Pipeline
                    </h3>
                    <form
                        onSubmit={handleCreate}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
                    >
                        <div className="md:col-span-3">
                            <label
                                htmlFor="newName"
                                className="block text-xs font-medium text-slate-700 mb-1"
                            >
                                Pipeline Name
                            </label>
                            <Input
                                id="newName"
                                required
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. My Custom Extractor"
                                className="w-full text-sm"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label
                                htmlFor="newJobType"
                                className="block text-xs font-medium text-slate-700 mb-1"
                            >
                                Job Type
                            </label>
                            <select
                                id="newJobType"
                                required
                                value={newJobType}
                                onChange={(e) => setNewJobType(e.target.value as JobType)}
                                className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 bg-white"
                            >
                                {JOB_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-4">
                            <label
                                htmlFor="newDesc"
                                className="block text-xs font-medium text-slate-700 mb-1"
                            >
                                Description (Optional)
                            </label>
                            <Input
                                id="newDesc"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="What does this do?"
                                className="w-full text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Btn.Primary type="submit" disabled={isCreating} className="w-full">
                                {isCreating ? "Saving..." : "Create"}
                            </Btn.Primary>
                        </div>
                    </form>
                </div>

                {/* Filters */}
                <div className="bg-gradient-to-br from-white via-white to-brand/5 rounded-card shadow-card border border-slate-100 p-5 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <Search className="w-4 h-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search pipelines"
                                className="rounded-xl w-full max-w-sm"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {availableJobTypes.map((type) => (
                                <button
                                    type="button"
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-medium border
                                        ${
                                            typeFilter === type
                                                ? "bg-brand text-white border-brand shadow-sm"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    {type === "ALL" ? "All Types" : type.replace(/_/g, " ")}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pipelines Table */}
                <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <GitFork className="w-4 h-4 text-slate-500" />
                            <h2 className="text-base font-semibold text-slate-900">
                                Configured Pipelines
                            </h2>
                            <span className="text-xs text-slate-500">
                                ({filteredPipelines.length})
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="px-5 py-3 text-sm text-rose-600 bg-rose-50 border-t border-rose-100">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="px-5 py-10 flex items-center justify-center gap-2 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading pipelines...
                        </div>
                    ) : filteredPipelines.length === 0 ? (
                        <div className="px-5 py-12 text-center text-slate-500">
                            No pipelines found. Create one above!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-slate-500 uppercase text-xs tracking-wide">
                                    <tr>
                                        <th className="px-5 py-3">ID / Name</th>
                                        <th className="px-5 py-3">Job Type</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Steps</th>
                                        <th className="px-5 py-3">Created</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPipelines.map((pipeline) => {
                                        const colorClass =
                                            badgeColors[pipeline.jobType] ||
                                            "bg-slate-100 text-slate-700";
                                        return (
                                            <tr
                                                key={pipeline.id}
                                                className="hover:bg-slate-50/60 transition-colors"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                        <span className="text-slate-400 font-normal">
                                                            #{pipeline.id}
                                                        </span>
                                                        {pipeline.name}
                                                    </div>
                                                    {pipeline.description && (
                                                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                                                            {pipeline.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}
                                                    >
                                                        {pipeline.jobType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {pipeline.isActive ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                                                            ACTIVE
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                                            INACTIVE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-slate-700">
                                                    <span className="font-semibold">
                                                        {pipeline.steps?.length || 0}
                                                    </span>{" "}
                                                    <span className="text-slate-500 text-xs">
                                                        steps
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-500 text-xs">
                                                    {pipeline.createdAt
                                                        ? new Date(
                                                              pipeline.createdAt,
                                                          ).toLocaleDateString()
                                                        : "—"}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {pipeline.isActive ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeactivate(pipeline.id)
                                                                }
                                                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition"
                                                                title="Deactivate"
                                                            >
                                                                <Pause className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleActivate(pipeline.id)
                                                                }
                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                                                                title="Activate"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <Link
                                                            to={`/admin/pipelines/${pipeline.id}`}
                                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded font-medium text-xs transition"
                                                        >
                                                            Edit Steps
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(pipeline.id)
                                                            }
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                                                            title="Delete Pipeline"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PipelineListPage;
