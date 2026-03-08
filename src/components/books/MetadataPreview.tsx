import { ChevronDown, ChevronRight } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { SentenceMetadata } from "../../types/book";
import WordChip from "./WordChip";

interface MetadataPreviewProps {
    metadata: SentenceMetadata;
}

const MetadataPreview: React.FC<MetadataPreviewProps> = ({ metadata }) => {
    const [expanded, setExpanded] = useState(false);
    const wordCount = metadata.words?.length ?? 0;

    return (
        <div className="-mx-3 px-3 pb-2">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 font-mono ml-12 transition-colors"
            >
                {expanded ? (
                    <ChevronDown className="w-3 h-3" />
                ) : (
                    <ChevronRight className="w-3 h-3" />
                )}
                metadata
                {wordCount > 0 && <span className="text-slate-300 ml-1">{wordCount} words</span>}
            </button>
            {expanded && (
                <div className="ml-12 mt-1.5 space-y-2">
                    {metadata.translation && (
                        <p className="text-[13px] text-slate-500 italic">{metadata.translation}</p>
                    )}
                    {wordCount > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {metadata.words.map((w, i) => (
                                <WordChip key={`${w.word}-${i}`} word={w} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MetadataPreview;
