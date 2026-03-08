import type React from "react";
import type { WordMeta } from "../../types/book";

interface WordChipProps {
    word: WordMeta;
}

const WordChip: React.FC<WordChipProps> = ({ word }) => {
    return (
        <div className="inline-flex flex-col items-start px-2 py-1 bg-slate-50 border border-slate-100 rounded-md hover:bg-slate-100 transition-colors cursor-default relative group/chip">
            <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-medium text-slate-700">{word.word}</span>
                {word.ipa && (
                    <span className="text-[10px] text-slate-400 font-mono">{word.ipa}</span>
                )}
            </div>
            {word.translation && (
                <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    {word.translation}
                </span>
            )}
            <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/chip:block z-20 w-56 p-2.5 bg-slate-800 text-white rounded-lg shadow-lg text-[12px] leading-relaxed pointer-events-none">
                <p className="font-medium">
                    {word.clean_word}
                    {word.ipa && (
                        <span className="ml-1.5 font-normal text-slate-400">{word.ipa}</span>
                    )}
                </p>
                {word.definition && <p className="mt-1 text-slate-300">{word.definition}</p>}
                {word.translation && (
                    <p className="mt-1 text-slate-300 italic">{word.translation}</p>
                )}
                {word.example && (
                    <p className="mt-1 text-slate-400 italic">&ldquo;{word.example}&rdquo;</p>
                )}
                {word.sense_id != null && (
                    <p className="mt-1 text-slate-500 text-[10px] font-mono">
                        sense: {word.sense_id}
                    </p>
                )}
            </div>
        </div>
    );
};

export default WordChip;
