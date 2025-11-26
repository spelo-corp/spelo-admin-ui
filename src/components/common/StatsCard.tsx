import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon: Icon }) => {
    return (
        <div className="bg-white rounded-card shadow-card border border-slate-100 p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-shell text-brand shadow-inner">
                <Icon className="w-6 h-6" />
            </div>

            <div>
                <div className="text-xl font-semibold text-slate-900">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
            </div>
        </div>
    );
};

export default StatsCard;
