import React from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    hint?: ReactNode;
    tone?: "brand" | "good" | "warn" | "bad" | "neutral";
}

const toneStyles: Record<NonNullable<StatsCardProps["tone"]>, { iconBg: string; iconFg: string }> = {
    brand: { iconBg: "bg-brand/10", iconFg: "text-brand" },
    good: { iconBg: "bg-emerald-100", iconFg: "text-emerald-700" },
    warn: { iconBg: "bg-amber-100", iconFg: "text-amber-700" },
    bad: { iconBg: "bg-rose-100", iconFg: "text-rose-700" },
    neutral: { iconBg: "bg-slate-100", iconFg: "text-slate-700" },
};

const StatsCard: React.FC<StatsCardProps> = ({
    label,
    value,
    icon: Icon,
    hint,
    tone = "brand",
}) => {
    const styles = toneStyles[tone];
    return (
        <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 flex items-center gap-4 hover:shadow-shell/40 transition-shadow">
            <div className={`p-3 rounded-2xl shadow-inner ${styles.iconBg} ${styles.iconFg}`}>
                <Icon className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="min-w-0">
                <div className="text-xl font-semibold text-slate-900">{value}</div>
                <div className="text-sm text-slate-500 truncate">{label}</div>
                {hint ? <div className="text-xs text-slate-500 mt-1 truncate">{hint}</div> : null}
            </div>
        </div>
    );
};

export default StatsCard;
