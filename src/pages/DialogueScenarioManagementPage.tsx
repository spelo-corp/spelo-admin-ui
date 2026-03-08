import {
    CircleAlert,
    Edit,
    MessageSquare,
    Plus,
    Power,
    PowerOff,
    Search,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import {
    useCreateDialogueScenario,
    useDeleteDialogueScenario,
    useDialogueScenarios,
    useToggleDialogueScenario,
    useUpdateDialogueScenario,
} from "../hooks/useDialogueScenarios";
import type { DialogueScenarioDTO, DialogueScenarioRequest } from "../types/dialogueScenario";

const CATEGORIES = ["Travel", "Work", "Daily", "Social", "Medical"];
const DIFFICULTIES = ["guided", "semi_open", "open"];

const difficultyLabel = (d: string) => {
    switch (d) {
        case "guided":
            return "Guided";
        case "semi_open":
            return "Semi-open";
        case "open":
            return "Open";
        default:
            return d;
    }
};

const difficultyColor = (d: string) => {
    switch (d) {
        case "guided":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "semi_open":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "open":
            return "bg-rose-50 text-rose-700 border-rose-200";
        default:
            return "bg-slate-50 text-slate-600 border-slate-200";
    }
};

const DialogueScenarioManagementPage: React.FC = () => {
    const { data: scenarios = [], isLoading: loading } = useDialogueScenarios();
    const createMutation = useCreateDialogueScenario();
    const updateMutation = useUpdateDialogueScenario();
    const deleteMutation = useDeleteDialogueScenario();
    const toggleMutation = useToggleDialogueScenario();

    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("All");

    // Create/Edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<DialogueScenarioDTO | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Travel");
    const [difficulty, setDifficulty] = useState("guided");
    const [aiPersona, setAiPersona] = useState("");
    const [setting, setSetting] = useState("");
    const [contextData, setContextData] = useState("");
    const [checkpoints, setCheckpoints] = useState("[]");
    const [targetVocab, setTargetVocab] = useState("");
    const [targetGrammar, setTargetGrammar] = useState("");
    const [suggestedResponses, setSuggestedResponses] = useState("");
    const [openingLine, setOpeningLine] = useState("");
    const [maxTurns, setMaxTurns] = useState(10);
    const [estimatedMinutes, setEstimatedMinutes] = useState(5);
    const [iconUrl, setIconUrl] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState(0);

    // Delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DialogueScenarioDTO | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setCategory("Travel");
        setDifficulty("guided");
        setAiPersona("");
        setSetting("");
        setContextData("");
        setCheckpoints("[]");
        setTargetVocab("");
        setTargetGrammar("");
        setSuggestedResponses("");
        setOpeningLine("");
        setMaxTurns(10);
        setEstimatedMinutes(5);
        setIconUrl("");
        setIsActive(true);
        setSortOrder(0);
        setEditing(null);
        setModalError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (s: DialogueScenarioDTO) => {
        setEditing(s);
        setTitle(s.title);
        setDescription(s.description);
        setCategory(s.category);
        setDifficulty(s.difficulty);
        setAiPersona(s.ai_persona);
        setSetting(s.setting);
        setContextData(s.context_data ?? "");
        setCheckpoints(s.checkpoints);
        setTargetVocab(s.target_vocab ?? "");
        setTargetGrammar(s.target_grammar ?? "");
        setSuggestedResponses(s.suggested_responses ?? "");
        setOpeningLine(s.opening_line ?? "");
        setMaxTurns(s.max_turns);
        setEstimatedMinutes(s.estimated_minutes);
        setIconUrl(s.icon_url ?? "");
        setIsActive(s.is_active);
        setSortOrder(s.sort_order);
        setModalError(null);
        setModalOpen(true);
    };

    const openDeleteModal = (s: DialogueScenarioDTO) => {
        setDeleteTarget(s);
        setDeleteError(null);
        setDeleteOpen(true);
    };

    const closeDeleteModal = () => {
        if (deleteMutation.isPending) return;
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteError(null);
    };

    const handleSave = async () => {
        if (!title.trim() || !description.trim() || !aiPersona.trim() || !setting.trim()) {
            setModalError("Title, description, AI persona, and setting are required.");
            return;
        }

        // Validate JSON fields
        for (const [label, val] of [
            ["Checkpoints", checkpoints],
            ["Context Data", contextData],
            ["Target Vocab", targetVocab],
            ["Target Grammar", targetGrammar],
            ["Suggested Responses", suggestedResponses],
        ] as const) {
            if (val?.trim()) {
                try {
                    JSON.parse(val);
                } catch {
                    setModalError(`${label} must be valid JSON.`);
                    return;
                }
            }
        }

        setModalError(null);

        const payload: DialogueScenarioRequest = {
            title: title.trim(),
            description: description.trim(),
            category,
            difficulty,
            ai_persona: aiPersona.trim(),
            setting: setting.trim(),
            context_data: contextData.trim() || null,
            checkpoints: checkpoints.trim() || "[]",
            target_vocab: targetVocab.trim() || null,
            target_grammar: targetGrammar.trim() || null,
            suggested_responses: suggestedResponses.trim() || null,
            opening_line: openingLine.trim() || null,
            max_turns: maxTurns,
            estimated_minutes: estimatedMinutes,
            icon_url: iconUrl.trim() || null,
            is_active: isActive,
            sort_order: sortOrder,
        };

        try {
            if (editing) {
                await updateMutation.mutateAsync({ id: editing.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            setModalOpen(false);
            resetForm();
        } catch (e) {
            setModalError(e instanceof Error ? e.message : "Failed to save scenario.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteOpen(false);
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : "Failed to delete scenario.");
        }
    };

    const handleToggle = (s: DialogueScenarioDTO) => {
        toggleMutation.mutate({ id: s.id, activate: !s.is_active });
    };

    const filteredScenarios = useMemo(() => {
        const term = search.trim().toLowerCase();
        return scenarios.filter((s) => {
            const matchesSearch =
                !term ||
                s.title.toLowerCase().includes(term) ||
                s.description.toLowerCase().includes(term) ||
                s.category.toLowerCase().includes(term);
            const matchesCategory = filterCategory === "All" || s.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [scenarios, search, filterCategory]);

    const activeCount = useMemo(() => scenarios.filter((s) => s.is_active).length, [scenarios]);
    const inactiveCount = scenarios.length - activeCount;

    const saving = createMutation.isPending || updateMutation.isPending;
    const deleting = deleteMutation.isPending;

    return (
        <div className="space-y-8 px-8 py-6">
            {/* HERO */}
            <PageHeader
                badge={
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Dialogue
                    </div>
                }
                title="Dialogue Scenarios"
                titleAddon={
                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                        {scenarios.length} total
                    </span>
                }
                description="Create and manage AI dialogue practice scenarios for language learners."
                actions={
                    <Btn.HeroPrimary onClick={openCreateModal}>
                        <Plus className="w-4 h-4" />
                        New Scenario
                    </Btn.HeroPrimary>
                }
            >
                <div className="flex gap-3 text-xs text-white/80">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                        <Power className="w-3.5 h-3.5" /> Active: {activeCount}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                        <PowerOff className="w-3.5 h-3.5" /> Inactive: {inactiveCount}
                    </span>
                </div>
            </PageHeader>

            {/* FILTERS */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title, description, or category"
                                className="rounded-xl pl-9"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {["All", ...CATEGORIES].map((cat) => (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                                    filterCategory === cat
                                        ? "bg-brand text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* SCENARIO LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                Scenarios
                            </p>
                            <p className="text-sm text-slate-600">
                                {filteredScenarios.length} showing
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-card border border-slate-100 p-4 space-y-4 shadow-sm"
                                >
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : scenarios.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-slate-700">No scenarios found yet.</p>
                            <p className="text-sm text-slate-500">
                                Create your first dialogue scenario to get started.
                            </p>
                            <div className="flex justify-center pt-1">
                                <Btn.Primary onClick={openCreateModal} className="px-5">
                                    <Plus className="w-4 h-4" />
                                    Create Scenario
                                </Btn.Primary>
                            </div>
                        </div>
                    ) : filteredScenarios.length === 0 ? (
                        <div className="text-center py-10 space-y-2 text-sm text-slate-500">
                            <p className="text-lg text-slate-700 font-semibold">
                                No scenarios match your filters.
                            </p>
                            <p>Try a different search term or category.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredScenarios.map((scenario) => (
                                <div
                                    key={scenario.id}
                                    className={`bg-white rounded-card border p-5 shadow-sm hover:shadow-md transition space-y-4 ${
                                        scenario.is_active
                                            ? "border-slate-100"
                                            : "border-slate-200 opacity-60"
                                    }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-slate-800 truncate">
                                                {scenario.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                                                {scenario.description}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleToggle(scenario)}
                                            disabled={toggleMutation.isPending}
                                            className={`shrink-0 p-1.5 rounded-lg transition ${
                                                scenario.is_active
                                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            }`}
                                            title={scenario.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {scenario.is_active ? (
                                                <Power className="w-4 h-4" />
                                            ) : (
                                                <PowerOff className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                                            {scenario.category}
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded-lg border ${difficultyColor(scenario.difficulty)}`}
                                        >
                                            {difficultyLabel(scenario.difficulty)}
                                        </span>
                                        <span className="text-slate-400">
                                            ~{scenario.estimated_minutes} min
                                        </span>
                                        <span className="text-slate-400">
                                            {scenario.max_turns} turns
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(scenario)}
                                            className="flex-1 px-3 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(scenario)}
                                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE/EDIT MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-3 py-8 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-shell w-full max-w-2xl p-6 border border-slate-100 animate-slideIn">
                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Scenario
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {editing ? "Edit Scenario" : "Create New Scenario"}
                                    </h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setModalOpen(false);
                                    resetForm();
                                }}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* FORM */}
                        <div className="space-y-5 text-sm max-h-[70vh] overflow-y-auto pr-1">
                            {modalError && (
                                <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs">
                                    {modalError}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Title *
                                </label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Category + Difficulty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Difficulty *
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                    >
                                        {DIFFICULTIES.map((d) => (
                                            <option key={d} value={d}>
                                                {difficultyLabel(d)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* AI Persona */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    AI Persona *
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={3}
                                    placeholder="e.g. You are a friendly waiter at a mid-range Italian restaurant..."
                                    value={aiPersona}
                                    onChange={(e) => setAiPersona(e.target.value)}
                                />
                            </div>

                            {/* Setting */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Setting *
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={2}
                                    placeholder="e.g. A busy Italian restaurant during dinner service..."
                                    value={setting}
                                    onChange={(e) => setSetting(e.target.value)}
                                />
                            </div>

                            {/* Opening Line */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Opening Line
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={2}
                                    placeholder="Leave empty for AI-generated opening"
                                    value={openingLine}
                                    onChange={(e) => setOpeningLine(e.target.value)}
                                />
                            </div>

                            {/* Max Turns + Estimated Minutes + Sort Order */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Max Turns *
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={maxTurns}
                                        onChange={(e) => setMaxTurns(Number(e.target.value) || 1)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Est. Minutes *
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={estimatedMinutes}
                                        onChange={(e) =>
                                            setEstimatedMinutes(Number(e.target.value) || 1)
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Sort Order
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            {/* Checkpoints (JSON) */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Checkpoints (JSON array) *
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-xs"
                                    rows={4}
                                    placeholder='[{"id":"greet","description":"Greet the waiter","required":true}]'
                                    value={checkpoints}
                                    onChange={(e) => setCheckpoints(e.target.value)}
                                />
                            </div>

                            {/* Context Data (JSON) */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Context Data (JSON)
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-xs"
                                    rows={3}
                                    placeholder='{"menu_items":["pasta","pizza"]}'
                                    value={contextData}
                                    onChange={(e) => setContextData(e.target.value)}
                                />
                            </div>

                            {/* Target Vocab (JSON) */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Target Vocabulary (JSON array)
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-xs"
                                    rows={2}
                                    placeholder='["reservation","appetizer","check"]'
                                    value={targetVocab}
                                    onChange={(e) => setTargetVocab(e.target.value)}
                                />
                            </div>

                            {/* Target Grammar (JSON) */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Target Grammar (JSON array)
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-xs"
                                    rows={2}
                                    placeholder='["could I have...","I would like..."]'
                                    value={targetGrammar}
                                    onChange={(e) => setTargetGrammar(e.target.value)}
                                />
                            </div>

                            {/* Suggested Responses (JSON) */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Initial Suggested Responses (JSON array)
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-xs"
                                    rows={2}
                                    placeholder='["Hello, table for two please","I have a reservation"]'
                                    value={suggestedResponses}
                                    onChange={(e) => setSuggestedResponses(e.target.value)}
                                />
                            </div>

                            {/* Icon URL + Active */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Icon URL
                                    </label>
                                    <Input
                                        value={iconUrl}
                                        onChange={(e) => setIconUrl(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm"
                                        value={isActive ? "1" : "0"}
                                        onChange={(e) => setIsActive(e.target.value === "1")}
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-2 mt-6">
                            <Btn.Secondary
                                onClick={() => {
                                    setModalOpen(false);
                                    resetForm();
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </Btn.Secondary>
                            <Btn.Primary onClick={handleSave} disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : editing
                                      ? "Save Changes"
                                      : "Create Scenario"}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {deleteOpen && deleteTarget ? (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-card shadow-shell w-full max-w-md border border-slate-100 overflow-hidden">
                        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-600 to-amber-500 text-white px-6 py-5">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
                            <div className="relative flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">
                                        Delete scenario
                                    </p>
                                    <h2 className="mt-2 text-xl font-semibold truncate">
                                        {deleteTarget.title}
                                    </h2>
                                    <p className="mt-1 text-sm text-white/80">
                                        If this scenario has active sessions, it will be deactivated
                                        instead of deleted.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={deleting}
                                    className="rounded-full p-2 text-white/80 transition hover:bg-white/15 disabled:opacity-60"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <div className="flex items-start gap-2">
                                    <CircleAlert className="w-5 h-5 mt-0.5" />
                                    <div>
                                        <div className="font-semibold">Are you sure?</div>
                                        <div className="text-amber-800/80">
                                            This action cannot be undone if the scenario has no
                                            sessions.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {deleteError ? (
                                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {deleteError}
                                </div>
                            ) : null}

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                                <Btn.Secondary onClick={closeDeleteModal} disabled={deleting}>
                                    Cancel
                                </Btn.Secondary>
                                <Btn.Primary
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="bg-rose-600 hover:bg-rose-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {deleting ? "Deleting..." : "Delete Scenario"}
                                </Btn.Primary>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default DialogueScenarioManagementPage;
