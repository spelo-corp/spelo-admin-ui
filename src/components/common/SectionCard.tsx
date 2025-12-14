import React from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type SectionCardTone = "default" | "soft";

interface SectionCardProps {
    title: ReactNode;
    icon?: LucideIcon;
    action?: ReactNode;
    tone?: SectionCardTone;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}

const toneClassName: Record<SectionCardTone, string> = {
    default: "bg-white border-slate-100",
    soft: "bg-slate-50/60 border-slate-200",
};

const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon: Icon,
    action,
    tone = "default",
    children,
    className = "",
    bodyClassName = "p-5",
}) => {
    return (
        <section
            className={`
                rounded-card shadow-card border overflow-hidden
                ${toneClassName[tone]}
                ${className}
            `}
        >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                    {Icon ? (
                        <span className="h-8 w-8 rounded-2xl bg-slate-100 text-slate-700 inline-flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                        </span>
                    ) : null}
                    <h2 className="text-base font-semibold text-slate-900 truncate">{title}</h2>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className={bodyClassName}>{children}</div>
        </section>
    );
};

export default SectionCard;

