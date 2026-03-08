import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import WordAccordionItem, { type DraftWord } from "./WordAccordionItem";

interface MetadataEditorProps {
    translation: string;
    words: DraftWord[];
    onTranslationChange: (value: string) => void;
    onWordsChange: (words: DraftWord[]) => void;
    disabled: boolean;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({
    translation,
    words,
    onTranslationChange,
    onWordsChange,
    disabled,
}) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const updateWord = (index: number, field: keyof DraftWord, value: string | boolean) => {
        const updated = words.map((w, i) => (i === index ? { ...w, [field]: value } : w));
        onWordsChange(updated);
    };

    const removeWord = (index: number) => {
        onWordsChange(words.filter((_, i) => i !== index));
        if (expandedIndex === index) setExpandedIndex(null);
        else if (expandedIndex != null && expandedIndex > index) {
            setExpandedIndex(expandedIndex - 1);
        }
    };

    const addWord = () => {
        const newWord: DraftWord = {
            word: "",
            clean_word: "",
            definition: "",
            translation: "",
            ipa: "",
            example: "",
            sense_id: "",
            no_sense: false,
        };
        onWordsChange([...words, newWord]);
        setExpandedIndex(words.length);
    };

    return (
        <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Metadata
                </span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            <label className="block">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Translation
                </span>
                <input
                    type="text"
                    value={translation}
                    onChange={(e) => onTranslationChange(e.target.value)}
                    disabled={disabled}
                    placeholder="Sentence translation (Vietnamese)"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-slate-50 disabled:opacity-60"
                />
            </label>

            <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Words ({words.length})
                </span>
                <button
                    type="button"
                    onClick={addWord}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-600 transition-colors disabled:opacity-60"
                >
                    <Plus className="w-3 h-3" />
                    Add Word
                </button>
            </div>

            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {words.map((word, index) => (
                    <WordAccordionItem
                        key={`${word.word}-${word.clean_word}-${index}`}
                        word={word}
                        index={index}
                        isExpanded={expandedIndex === index}
                        onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        onUpdate={(field, value) => updateWord(index, field, value)}
                        onRemove={() => removeWord(index)}
                        disabled={disabled}
                    />
                ))}
                {words.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 text-center">
                        No words. Click &ldquo;Add Word&rdquo; to add vocabulary entries.
                    </p>
                )}
            </div>
        </div>
    );
};

export default MetadataEditor;
