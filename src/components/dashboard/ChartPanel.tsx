import React from "react";

const ChartPanel: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div
            className="
        bg-white rounded-card shadow-card border border-slate-200
        p-6 flex flex-col gap-4
      "
        >
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>

            {/* Chart placeholder */}
            <div className="h-64 bg-slate-100 rounded-card flex items-center justify-center text-slate-400 text-sm">
                Chart goes here
            </div>
        </div>
    );
};

export default ChartPanel;
