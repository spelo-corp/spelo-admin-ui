import { AlertCircle, Check, ImageIcon, Loader2, Pencil, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { booksApi } from "../../api/books";
import type { ContentSentence, SentenceMetadata, WordMeta } from "../../types/book";
import MetadataEditor from "./MetadataEditor";
import MetadataPreview from "./MetadataPreview";
import type { DraftWord } from "./WordAccordionItem";

interface EditableSentenceRowProps {
    sentence: ContentSentence;
    onSaved: (updated: ContentSentence) => void;
}

interface Draft {
    text: string;
    sequence: number;
    paragraphIndex: number;
    tokenCount: number;
    metadataTranslation: string;
    metadataWords: DraftWord[];
}

function wordMetaToDraft(w: WordMeta): DraftWord {
    return {
        word: w.word ?? "",
        clean_word: w.clean_word ?? "",
        definition: w.definition ?? "",
        translation: w.translation ?? "",
        ipa: w.ipa ?? "",
        example: w.example ?? "",
        sense_id: w.sense_id != null ? String(w.sense_id) : "",
        no_sense: w.no_sense ?? false,
    };
}

function draftWordsToMeta(words: DraftWord[]): WordMeta[] {
    return words.map((w) => ({
        word: w.word,
        clean_word: w.clean_word,
        definition: w.definition || null,
        translation: w.translation || null,
        ipa: w.ipa || null,
        example: w.example || null,
        sense_id: w.sense_id ? parseInt(w.sense_id, 10) || null : null,
        no_sense: w.no_sense || null,
    }));
}

function buildMetadata(
    translation: string,
    words: DraftWord[],
    original: SentenceMetadata | null,
): SentenceMetadata | null {
    const hasTranslation = translation.trim().length > 0;
    const hasWords = words.length > 0;
    if (!hasTranslation && !hasWords) return null;

    const result: SentenceMetadata = {
        ...(original || {}),
        contains_latex: original?.contains_latex ?? null,
        translation: hasTranslation ? translation.trim() : null,
        words: draftWordsToMeta(words),
    };
    return result;
}

const ImagePreview: React.FC<{ objectName: string; alt: string }> = ({ objectName, alt }) => {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        if (objectName.startsWith("http")) {
            setSrc(objectName);
            return;
        }
        // Strip path prefix if stored as full download path
        const prefix = "/api/v1/file/download/spelo-content/";
        const cleanName = objectName.startsWith(prefix)
            ? objectName.slice(prefix.length)
            : objectName;
        let cancelled = false;
        booksApi
            .getPresignedUrl("spelo-content", cleanName)
            .then((url) => {
                if (!cancelled) setSrc(url);
            })
            .catch(() => {
                if (!cancelled) setSrc(null);
            });
        return () => {
            cancelled = true;
        };
    }, [objectName]);

    if (!src) {
        return (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading image...
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="max-w-md max-h-48 rounded-lg border border-slate-200 object-cover"
        />
    );
};

const EditableSentenceRow: React.FC<EditableSentenceRowProps> = ({ sentence, onSaved }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const startEditing = () => {
        const meta = sentence.metadata;
        setDraft({
            text: sentence.text,
            sequence: sentence.sequence,
            paragraphIndex: sentence.paragraphIndex,
            tokenCount: sentence.tokenCount,
            metadataTranslation: meta?.translation ?? "",
            metadataWords: (meta?.words ?? []).map(wordMetaToDraft),
        });
        setError(null);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setDraft(null);
        setError(null);
    };

    const handleSave = async () => {
        if (!draft || !draft.text.trim()) return;

        setSaving(true);
        setError(null);
        try {
            const metadata = buildMetadata(
                draft.metadataTranslation,
                draft.metadataWords,
                sentence.metadata,
            );
            const updated = await booksApi.updateSentence(sentence.id, {
                text: draft.text,
                sequence: draft.sequence,
                paragraph_index: draft.paragraphIndex,
                token_count: draft.tokenCount,
                metadata,
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

    const hasMetadata =
        sentence.metadata &&
        (sentence.metadata.translation || (sentence.metadata.words?.length ?? 0) > 0);

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

                <MetadataEditor
                    translation={draft.metadataTranslation}
                    words={draft.metadataWords}
                    onTranslationChange={(v) => setDraft({ ...draft, metadataTranslation: v })}
                    onWordsChange={(w) => setDraft({ ...draft, metadataWords: w })}
                    disabled={saving}
                />

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
                        disabled={saving || !draft.text.trim()}
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

                {error && (
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
                    {sentence.blockType === "image" ? (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                <ImageIcon className="w-3 h-3" />
                                Image
                            </div>
                            <ImagePreview
                                objectName={sentence.text}
                                alt={(sentence.metadata?.caption as string) || "Content image"}
                            />
                            {!!sentence.metadata?.caption && (
                                <p className="text-[13px] text-slate-500 italic">
                                    {String(sentence.metadata.caption)}
                                </p>
                            )}
                        </div>
                    ) : sentence.blockType === "heading" ? (
                        <p className="text-lg font-bold text-slate-900">{sentence.text}</p>
                    ) : sentence.blockType === "quote" ? (
                        <blockquote className="border-l-3 border-slate-300 pl-3 text-[15px] italic text-slate-600 leading-relaxed">
                            {sentence.text}
                        </blockquote>
                    ) : (
                        <p className="text-[15px] leading-relaxed text-slate-700 font-medium tracking-wide">
                            {sentence.text}
                        </p>
                    )}
                    {sentence.blockType !== "image" && sentence.metadata?.translation && (
                        <p className="text-[13px] text-slate-400 italic">
                            {sentence.metadata.translation}
                        </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {sentence.blockType !== "text" && (
                            <span className="text-amber-600">{sentence.blockType}</span>
                        )}
                        {sentence.tokenCount > 0 && <span>tokens: {sentence.tokenCount}</span>}
                        {hasMetadata && (
                            <span className="text-brand-500">
                                {sentence.metadata?.words?.length ?? 0} words
                            </span>
                        )}
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

            {hasMetadata && sentence.metadata && <MetadataPreview metadata={sentence.metadata} />}
        </div>
    );
};

export default EditableSentenceRow;
