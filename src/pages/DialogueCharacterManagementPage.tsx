import {
    CircleAlert,
    Edit,
    Plus,
    Power,
    PowerOff,
    Search,
    Sparkles,
    Trash2,
    UserCircle,
    X,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import { Btn } from "../components/ui/Btn";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import {
    useCreateDialogueCharacter,
    useDeleteDialogueCharacter,
    useDialogueCharacters,
    useUpdateDialogueCharacter,
} from "../hooks/useDialogueCharacters";
import type { DialogueCharacter, DialogueCharacterRequest } from "../types/dialogueScenario";

const DialogueCharacterManagementPage: React.FC = () => {
    const { data: characters = [], isLoading: loading } = useDialogueCharacters();
    const createMutation = useCreateDialogueCharacter();
    const updateMutation = useUpdateDialogueCharacter();
    const deleteMutation = useDeleteDialogueCharacter();

    const [search, setSearch] = useState("");

    // Create/Edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<DialogueCharacter | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [personality, setPersonality] = useState("");
    const [speechStyle, setSpeechStyle] = useState("");
    const [catchphrases, setCatchphrases] = useState("");
    const [habits, setHabits] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isActive, setIsActive] = useState(true);

    // Delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DialogueCharacter | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const resetForm = () => {
        setName("");
        setRole("");
        setPersonality("");
        setSpeechStyle("");
        setCatchphrases("");
        setHabits("");
        setAvatarUrl("");
        setIsActive(true);
        setEditing(null);
        setModalError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (c: DialogueCharacter) => {
        setEditing(c);
        setName(c.name);
        setRole(c.role);
        setPersonality(c.personality);
        setSpeechStyle(c.speech_style);
        setCatchphrases(c.catchphrases ?? "");
        setHabits(c.habits ?? "");
        setAvatarUrl(c.avatar_url ?? "");
        setIsActive(c.is_active);
        setModalError(null);
        setModalOpen(true);
    };

    const openDeleteModal = (c: DialogueCharacter) => {
        setDeleteTarget(c);
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
        if (!name.trim() || !role.trim() || !personality.trim() || !speechStyle.trim()) {
            setModalError("Name, role, personality, and speech style are required.");
            return;
        }

        setModalError(null);

        const payload: DialogueCharacterRequest = {
            name: name.trim(),
            role: role.trim(),
            personality: personality.trim(),
            speech_style: speechStyle.trim(),
            catchphrases: catchphrases.trim() || null,
            habits: habits.trim() || null,
            avatar_url: avatarUrl.trim() || null,
            is_active: isActive,
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
            setModalError(e instanceof Error ? e.message : "Failed to save character.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteOpen(false);
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : "Failed to delete character.");
        }
    };

    const filteredCharacters = useMemo(() => {
        const term = search.trim().toLowerCase();
        return characters.filter((c) => {
            return (
                !term ||
                c.name.toLowerCase().includes(term) ||
                c.role.toLowerCase().includes(term) ||
                c.personality.toLowerCase().includes(term)
            );
        });
    }, [characters, search]);

    const activeCount = useMemo(() => characters.filter((c) => c.is_active).length, [characters]);
    const inactiveCount = characters.length - activeCount;

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
                title="Dialogue Characters"
                titleAddon={
                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                        {characters.length} total
                    </span>
                }
                description="Create and manage AI characters for dialogue scenarios."
                actions={
                    <Btn.HeroPrimary onClick={openCreateModal}>
                        <Plus className="w-4 h-4" />
                        New Character
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
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, role, or personality"
                            className="rounded-xl pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* CHARACTER LIST */}
            <div className="bg-white rounded-card shadow-card border border-slate-100 p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                            <UserCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                Characters
                            </p>
                            <p className="text-sm text-slate-600">
                                {filteredCharacters.length} showing
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
                    ) : characters.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                <UserCircle className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-slate-700">No characters found yet.</p>
                            <p className="text-sm text-slate-500">
                                Create your first dialogue character to get started.
                            </p>
                            <div className="flex justify-center pt-1">
                                <Btn.Primary onClick={openCreateModal} className="px-5">
                                    <Plus className="w-4 h-4" />
                                    Create Character
                                </Btn.Primary>
                            </div>
                        </div>
                    ) : filteredCharacters.length === 0 ? (
                        <div className="text-center py-10 space-y-2 text-sm text-slate-500">
                            <p className="text-lg text-slate-700 font-semibold">
                                No characters match your search.
                            </p>
                            <p>Try a different search term.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCharacters.map((character) => (
                                <div
                                    key={character.id}
                                    className={`bg-white rounded-card border p-5 shadow-sm hover:shadow-md transition space-y-4 ${
                                        character.is_active
                                            ? "border-slate-100"
                                            : "border-slate-200 opacity-60"
                                    }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex items-start gap-3">
                                            {character.avatar_url ? (
                                                <img
                                                    src={character.avatar_url}
                                                    alt={character.name}
                                                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                                    <UserCircle className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-slate-800 truncate">
                                                    {character.name}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {character.role}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${
                                                character.is_active
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            {character.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    {/* Personality preview */}
                                    <p className="text-xs text-slate-500 line-clamp-3">
                                        {character.personality}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(character)}
                                            className="flex-1 px-3 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(character)}
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
                                    <UserCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Character
                                    </p>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {editing ? "Edit Character" : "Create New Character"}
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

                            {/* Name + Role */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Name *
                                    </label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Mike"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Role *
                                    </label>
                                    <Input
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        placeholder="e.g. Waiter"
                                    />
                                </div>
                            </div>

                            {/* Personality */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Personality *
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={4}
                                    placeholder="Describe the character's personality traits..."
                                    value={personality}
                                    onChange={(e) => setPersonality(e.target.value)}
                                />
                            </div>

                            {/* Speech Style */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Speech Style *
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={3}
                                    placeholder="Describe how this character speaks..."
                                    value={speechStyle}
                                    onChange={(e) => setSpeechStyle(e.target.value)}
                                />
                            </div>

                            {/* Catchphrases */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Catchphrases
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={2}
                                    placeholder="Common phrases this character uses..."
                                    value={catchphrases}
                                    onChange={(e) => setCatchphrases(e.target.value)}
                                />
                            </div>

                            {/* Habits */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Habits
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    rows={2}
                                    placeholder="Behavioral habits of the character..."
                                    value={habits}
                                    onChange={(e) => setHabits(e.target.value)}
                                />
                            </div>

                            {/* Avatar URL + Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Avatar URL
                                    </label>
                                    <Input
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
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
                                      : "Create Character"}
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
                                        Delete character
                                    </p>
                                    <h2 className="mt-2 text-xl font-semibold truncate">
                                        {deleteTarget.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-white/80">
                                        This character may be referenced by existing scenarios.
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
                                            This action cannot be undone. Scenarios using this
                                            character will need to be updated.
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
                                    {deleting ? "Deleting..." : "Delete Character"}
                                </Btn.Primary>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default DialogueCharacterManagementPage;
