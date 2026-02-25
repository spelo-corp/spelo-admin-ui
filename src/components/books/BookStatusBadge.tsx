import type React from "react";
import type { ContentSource } from "../../types/book";

type BookStatus = ContentSource["status"];

interface Props {
    status: BookStatus;
}

const badgeStyles: Record<BookStatus, string> = {
    PROCESSING: "bg-amber-50 text-amber-700 border border-amber-100",
    READY: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    DRAFT: "bg-slate-100 text-slate-700 border border-slate-200",
};

const dotStyles: Record<BookStatus, string> = {
    PROCESSING: "bg-amber-500 animate-pulse",
    READY: "bg-emerald-500",
    DRAFT: "bg-slate-400",
};

export const BookStatusBadge: React.FC<Props> = ({ status }) => (
    <span
        className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
            uppercase tracking-wide
            ${badgeStyles[status] ?? "bg-slate-100 text-slate-700 border border-slate-200"}
        `}
    >
        <span className={`w-2 h-2 rounded-full ${dotStyles[status] ?? "bg-slate-400"}`} />
        {status}
    </span>
);
