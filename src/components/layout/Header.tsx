import React from "react";

const Header: React.FC = () => {
    return (
        <header
            className="
      w-full bg-shell/80 backdrop-blur border-b border-slate-200
      px-8 py-4 flex items-center justify-between
    "
        >
            {/* Left: Search Bar */}
            <div className="flex items-center gap-3 w-[40%]">
                <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
                    <input
                        placeholder="Search lesson, audio, users..."
                        className="
              w-full h-10 pl-9 pr-3 rounded-full bg-white
              border border-slate-200 text-sm text-slate-700
              placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-brand/50
            "
                    />
                </div>

                {/* Shortcut indicator */}
                <div className="
          px-2 py-1 rounded-full bg-white border border-slate-200
          text-xs text-slate-500
        ">
                    ⌘K
                </div>
            </div>

            {/* Right: Icons + Profile */}
            <div className="flex items-center gap-4 text-slate-500">
                <button
                    className="
            w-10 h-10 rounded-full bg-white border border-slate-200
            flex items-center justify-center hover:text-brand
          "
                >
                    ✉️
                </button>

                <button
                    className="
            w-10 h-10 rounded-full bg-white border border-slate-200
            flex items-center justify-center hover:text-brand
          "
                >
                    🔔
                </button>

                {/* Profile chip */}
                <div
                    className="
            flex items-center gap-3 bg-white border border-slate-200
            rounded-full pl-2 pr-4 py-1 shadow-card
          "
                >
                    <div
                        className="
              w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark
              text-white flex items-center justify-center text-sm font-bold
            "
                    >
                        NB
                    </div>

                    <div className="text-sm leading-tight">
                        <div className="font-semibold text-slate-800">Ngọc Bích</div>
                        <div className="text-[11px] text-slate-400">Admin • Online ●</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
