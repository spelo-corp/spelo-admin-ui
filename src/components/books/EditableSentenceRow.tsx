import { AlertCircle, Check, ChevronDown, ChevronRight, Loader2, Pencil, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { booksApi } from "../../api/books";
import type { ContentSentence } from "../../types/book";

interface EditableSentenceRowProps {
    sentence: ContentSentence;
    onSaved: (updated: ContentSentence) => void;
}

interface Draft {
    text: string;
    sequence: number;
    paragraphIndex: number;
    tokenCount: number;
    metadata: string;
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
    if (!metadata) return "";
    try {
        return JSON.stringify(metadata, null, 2);
    } catch {
        return "";
    }
}

function parseMetadata(str: string): { valid: boolean; value: Record<string, unknown> | null } {
    const trimmed = str.trim();
    if (!trimmed) return { valid: true, value: null };
    try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            return { valid: true, value: parsed };
        }
        return { valid: false, value: null };
    } catch {
        return { valid: false, value: null };
    }
}

const EditableSentenceRow: React.FC<EditableSentenceRowProps> = ({ sentence, onSaved }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [metadataExpanded, setMetadataExpanded] = useState(false);
    const [metadataError, setMetadataError] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const startEditing = () => {
        setDraft({
            text: sentence.text,
            sequence: sentence.sequence,
            paragraphIndex: sentence.paragraphIndex,
            tokenCount: sentence.tokenCount,
            metadata: formatMetadata(sentence.metadata),
        });
        setError(null);
        setMetadataError(false);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setDraft(null);
        setError(null);
        setMetadataError(false);
    };

    const handleSave = async () => {
        if (!draft || !draft.text.trim()) return;

        const metaResult = parseMetadata(draft.metadata);
        if (!metaResult.valid) {
            setMetadataError(true);
            setError("Invalid JSON in metadata field.");
            return;
        }

        setSaving(true);
        setError(null);
        setMetadataError(false);
        try {
            const updated = await booksApi.updateSentence(sentence.id, {
                text: draft.text,
                sequence: draft.sequence,
                paragraph_index: draft.paragraphIndex,
                token_count: draft.tokenCount,
                metadata: draft.metadata.trim() || null,
            });
            onSaved(updated);
            setIsEditing(false);
            setDraft(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const ta = textareaRef.current;
            ta.focus();
            ta.selectionStart = ta.value.length;
            ta.selectionEnd = ta.value.length;
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            cancelEditing();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "Enter")) {
            e.preventDefault();
            handleSave();
        }
    };

    const hasMetadata = sentence.metadata && Object.keys(sentence.metadata).length > 0;

    if (isEditing && draft) {
        return (
            // biome-ignore lint/a11y/noStaticElementInteractions: form container needs keydown for shortcuts
            <div
                className={`rounded-xl border p-4 -mx-3 shadow-sm transition-all duration-200 ${
                    error ? "border-rose-200 bg-rose-50/20" : "border-brand/30 bg-emerald-50/30"
                }`}
                onKeyDown={handleKeyDown}
            >
                <textarea
                    ref={textareaRef}
                    value={draft.text}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                    disabled={saving}
                    className="w-full border border-slate-200 rounded-lg p-3 text-[15px] font-medium text-slate-700 leading-relaxed tracking-wide focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand resize-y min-h-[60px] disabled:bg-slate-50 disabled:opacity-60"
                    rows={Math.max(2, Math.ceil(draft.text.length / 80))}
                />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                    <label className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
                        Seq
                        <input
                            type="number"
                            value={draft.sequence}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    sequence: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            disabled={saving}
                            min={1}
                            className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
                        Para
                        <input
                            type="number"
                            value={draft.paragraphIndex ?? 0}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    paragraphIndex: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            disabled={saving}
                            min={0}
                            className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
                        Tokens
                        <input
                            type="number"
                            value={draft.tokenCount ?? 0}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    tokenCount: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            disabled={saving}
                            min={0}
                            className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-slate-50 disabled:opacity-60"
                        />
                    </label>
                </div>

                {/* Metadata JSON editor */}
                <label className="block mt-3">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        Metadata (JSON)
                    </span>
                    <textarea
                        value={draft.metadata}
                        onChange={(e) => {
                            setDraft({ ...draft, metadata: e.target.value });
                            if (metadataError) {
                                const result = parseMetadata(e.target.value);
                                setMetadataError(!result.valid);
                            }
                        }}
                        disabled={saving}
                        placeholder='{ "key": "value" }'
                        className={`mt-1 w-full border rounded-lg p-3 text-sm text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-2 resize-y min-h-[80px] disabled:bg-slate-50 disabled:opacity-60 ${
                            metadataError
                                ? "border-rose-300 focus:ring-rose-400/40 focus:border-rose-400"
                                : "border-slate-200 focus:ring-brand/40 focus:border-brand"
                        }`}
                        rows={Math.max(3, draft.metadata.split("\n").length)}
                    />
                </label>
                {metadataError && (
                    <p className="text-xs text-rose-500 mt-1">
                        Invalid JSON. Must be an object or empty.
                    </p>
                )}

                <div className="flex justify-end gap-2 mt-3">
                    <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
                    >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !draft.text.trim() || metadataError}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand border border-transparent rounded-lg hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Check className="w-3.5 h-3.5" />
                        )}
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>

                {error && !metadataError && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div
            className={`group rounded-xl transition-all ${
                showSuccess ? "bg-emerald-50/50 border-l-2 border-emerald-400" : "hover:bg-slate-50"
            }`}
        >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: edit via click is primary interaction */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: clickable row for editing */}
            <div onClick={startEditing} className="flex gap-4 p-3 -mx-3 cursor-pointer">
                <div className="w-8 shrink-0 flex justify-end">
                    <span className="text-[11px] font-mono text-slate-300 group-hover:text-brand-400 font-medium pt-1 transition-colors">
                        {String(sentence.sequence).padStart(3, "0")}
                    </span>
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-[15px] leading-relaxed text-slate-700 font-medium tracking-wide">
                        {sentence.text}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {sentence.tokenCount > 0 && <span>tokens: {sentence.tokenCount}</span>}
                        {hasMetadata && <span className="text-brand-500">has metadata</span>}
                    </div>
                </div>
                {showSuccess ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 self-start mt-1" />
                ) : (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            startEditing();
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0 self-start mt-0.5"
                        title="Edit sentence"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Collapsible metadata preview in normal state */}
            {hasMetadata && (
                <div className="-mx-3 px-3 pb-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMetadataExpanded(!metadataExpanded);
                        }}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 font-mono ml-12 transition-colors"
                    >
                        {metadataExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                        metadata
                    </button>
                    {metadataExpanded && (
                        <pre className="ml-12 mt-1 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 font-mono overflow-x-auto max-h-48 border border-slate-100">
                            {formatMetadata(sentence.metadata)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};

export default EditableSentenceRow;
