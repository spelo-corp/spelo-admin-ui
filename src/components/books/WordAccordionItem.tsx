import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import type React from "react";

export interface DraftWord {
    word: string;
    clean_word: string;
    definition: string;
    translation: string;
    ipa: string;
    example: string;
    sense_id: string;
    no_sense: boolean;
}

interface WordAccordionItemProps {
    word: DraftWord;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: (field: keyof DraftWord, value: string | boolean) => void;
    onRemove: () => void;
    disabled: boolean;
}

const inputClass =
    "mt-0.5 w-full border border-slate-200 rounded-md px-2 py-1.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:bg-slate-50 disabled:opacity-60";

const labelClass = "text-[10px] text-slate-400 font-medium uppercase tracking-wider";

const WordAccordionItem: React.FC<WordAccordionItemProps> = ({
    word,
    index: _index,
    isExpanded,
    onToggle,
    onUpdate,
    onRemove,
    disabled,
}) => {
    return (
        <div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <button
                    type="button"
                    onClick={onToggle}
                    className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                    )}
                </button>
                <span className="text-[13px] font-medium text-slate-700">{word.word || "..."}</span>
                {word.ipa && (
                    <span className="text-[11px] text-slate-400 font-mono">{word.ipa}</span>
                )}
                {word.translation && (
                    <>
                        <span className="text-slate-300">&middot;</span>
                        <span className="text-[12px] text-slate-400">{word.translation}</span>
                    </>
                )}
                <div className="flex-1" />
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={disabled}
                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors rounded hover:bg-rose-50 disabled:opacity-60"
                    title="Remove word"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
            {isExpanded && (
                <div className="mt-1 ml-5 mr-2 p-3 bg-white border border-slate-100 rounded-lg space-y-2.5">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                        <label className="block">
                            <span className={labelClass}>Word</span>
                            <input
                                type="text"
                                value={word.word}
                                onChange={(e) => onUpdate("word", e.target.value)}
                                disabled={disabled}
                                className={inputClass}
                            />
                        </label>
                        <label className="block">
                            <span className={labelClass}>Clean Word</span>
                            <input
                                type="text"
                                value={word.clean_word}
                                onChange={(e) => onUpdate("clean_word", e.target.value)}
                                disabled={disabled}
                                className={inputClass}
                            />
                        </label>
                        <label className="block">
                            <span className={labelClass}>IPA</span>
                            <input
                                type="text"
                                value={word.ipa}
                                onChange={(e) => onUpdate("ipa", e.target.value)}
                                disabled={disabled}
                                className={`${inputClass} font-mono`}
                            />
                        </label>
                        <label className="block">
                            <span className={labelClass}>Sense ID</span>
                            <input
                                type="text"
                                value={word.sense_id}
                                disabled
                                className={`${inputClass} font-mono bg-slate-50 text-slate-400`}
                            />
                        </label>
                    </div>
                    <label className="block">
                        <span className={labelClass}>Definition</span>
                        <input
                            type="text"
                            value={word.definition}
                            onChange={(e) => onUpdate("definition", e.target.value)}
                            disabled={disabled}
                            className={inputClass}
                        />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Translation</span>
                        <input
                            type="text"
                            value={word.translation}
                            onChange={(e) => onUpdate("translation", e.target.value)}
                            disabled={disabled}
                            className={inputClass}
                        />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Example</span>
                        <input
                            type="text"
                            value={word.example}
                            onChange={(e) => onUpdate("example", e.target.value)}
                            disabled={disabled}
                            className={inputClass}
                        />
                    </label>
                </div>
            )}
        </div>
    );
};

export default WordAccordionItem;
