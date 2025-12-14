import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Loader2, Pencil, Plus, Sparkles, X } from "lucide-react";
import { Btn } from "../ui/Btn";
import { Input } from "../ui/Input";

export interface VocabFormData {
    word: string;
    ipa: string;
    definition: string;
    translation: string;
    example: string;
}

interface VocabModalProps {
    show: boolean;
    mode: "create" | "edit";
    initialData?: VocabFormData | null;
    onClose: () => void;
    onSubmit: (data: VocabFormData) => void | Promise<void>;
}

const VocabModal: React.FC<VocabModalProps> = ({
    show,
    mode,
    initialData,
    onClose,
    onSubmit,
}) => {
    const titleId = useId();
    const descriptionId = useId();
    const wordRef = useRef<HTMLInputElement | null>(null);

    const emptyForm = useMemo<VocabFormData>(
        () => ({
            word: "",
            ipa: "",
            definition: "",
            translation: "",
            example: "",
        }),
        []
    );

    const [form, setForm] = useState<VocabFormData>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!show) return;

        setError(null);
        setForm(initialData ?? emptyForm);

        const t = window.setTimeout(() => {
            wordRef.current?.focus();
        }, 0);
        return () => window.clearTimeout(t);
    }, [emptyForm, initialData, show]);

    useEffect(() => {
        if (!show) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                if (!submitting) onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, show, submitting]);

    if (!show) return null;

    const title = mode === "create" ? "Add vocabulary" : "Edit vocabulary";
    const subtitle =
        mode === "create"
            ? "Create a polished word entry with IPA, meaning, and an example sentence."
            : "Update the word’s meaning or example without leaving the flow.";

    const Icon = mode === "create" ? Plus : Pencil;
    const primaryLabel = mode === "create" ? "Create word" : "Save changes";

    const canSubmit = form.word.trim().length > 0 && !submitting;

    const handleChange = (key: keyof VocabFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);

        const payload: VocabFormData = {
            word: form.word.trim(),
            ipa: form.ipa.trim(),
            translation: form.translation.trim(),
            definition: form.definition.trim(),
            example: form.example.trim(),
        };

        try {
            await onSubmit(payload);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to save vocabulary.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !submitting) onClose();
            }}
        >
            <div className="min-h-full w-full p-4 sm:p-6 flex items-center justify-center">
                <div className="w-full max-w-3xl overflow-hidden rounded-card bg-white shadow-shell border border-white/20">
                    {/* Header */}
                    <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-brand via-brand-dark to-emerald-700 px-6 py-5 text-white">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.22),transparent_42%)]" />
                        <div className="pointer-events-none absolute -top-24 -left-28 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                        <div className="relative flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Dictionary
                                </div>
                                <h2 id={titleId} className="mt-3 text-2xl font-semibold tracking-tight">
                                    <span className="inline-flex items-center gap-2">
                                        <Icon className="h-5 w-5" />
                                        {title}
                                    </span>
                                </h2>
                                <p id={descriptionId} className="mt-1 text-sm text-white/80">
                                    {subtitle}
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="rounded-full p-2 text-white/80 transition hover:bg-white/15 disabled:opacity-60"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </header>

                    {/* Body */}
                    <form
                        className="px-6 py-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleSubmit();
                        }}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault();
                                void handleSubmit();
                            }
                        }}
                    >
                        {error ? (
                            <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Word <span className="text-rose-600">*</span>
                                    </label>
                                    <Input
                                        ref={wordRef}
                                        value={form.word}
                                        onChange={(e) => handleChange("word", e.target.value)}
                                        placeholder="appointment, insurance, sustainable…"
                                        className="rounded-2xl px-4 py-2.5 text-slate-800 focus:ring-brand/20"
                                    />
                                    <div className="mt-1 text-[11px] text-slate-500">
                                        Tip: use the base form (e.g. “run”, “appointment”).
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        IPA (optional)
                                    </label>
                                    <Input
                                        value={form.ipa}
                                        onChange={(e) => handleChange("ipa", e.target.value)}
                                        placeholder="/əˈpɔɪntmənt/"
                                        className="rounded-2xl px-4 py-2.5 text-slate-800 focus:ring-brand/20"
                                    />
                                    <div className="mt-1 text-[11px] text-slate-500">
                                        Keep it short; one pronunciation is enough.
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Vietnamese meaning (optional)
                                    </label>
                                    <Input
                                        value={form.translation}
                                        onChange={(e) => handleChange("translation", e.target.value)}
                                        placeholder="cuộc hẹn, bảo hiểm…"
                                        className="rounded-2xl px-4 py-2.5 text-slate-800 focus:ring-brand/20"
                                    />
                                    <div className="mt-1 text-[11px] text-slate-500">
                                        Use a natural phrase, not a word-by-word translation.
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        English definition (optional)
                                    </label>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-inner shadow-slate-100 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                                        <textarea
                                            value={form.definition}
                                            onChange={(e) => handleChange("definition", e.target.value)}
                                            placeholder="A meeting arranged for a particular time…"
                                            className="h-24 w-full resize-none bg-transparent text-sm text-slate-800 outline-none"
                                        />
                                        <div className="mt-2 text-[11px] text-slate-500">
                                            Keep it learner-friendly; one sentence is ideal.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Example sentence (optional)
                            </label>
                            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-inner shadow-slate-100 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                                <textarea
                                    value={form.example}
                                    onChange={(e) => handleChange("example", e.target.value)}
                                    placeholder="I have a dentist appointment tomorrow morning."
                                    className="h-24 w-full resize-none bg-transparent text-sm text-slate-800 outline-none"
                                />
                                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                    <span className="inline-flex items-center gap-1">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        Press <span className="font-semibold text-slate-700">Ctrl/⌘ + Enter</span> to save
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                        {form.example.trim().length} chars
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="text-xs text-slate-500">
                                {form.word.trim().length > 0 ? (
                                    <span className="inline-flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        Ready to save
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                                        Word is required
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 sm:justify-end">
                                <Btn.Secondary onClick={onClose} disabled={submitting}>
                                    Cancel
                                </Btn.Secondary>
                                <Btn.Primary
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="min-w-[150px] justify-center"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        primaryLabel
                                    )}
                                </Btn.Primary>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VocabModal;
