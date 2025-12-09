import React from "react";
import { NavLink } from "react-router-dom";
import {
    Home,
    Settings,
    BookOpen,
    FileAudio2,
    Users,
    Workflow,
    HelpCircle,
    LogOut,
    Headphones,
} from "lucide-react";

const Sidebar: React.FC = () => {
    const base =
        "flex items-center gap-3 px-4 py-2.5 rounded-card text-[15px] font-medium transition";

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        isActive
            ? `${base} bg-gradient-to-r from-brand to-brand-dark text-white shadow-card`
            : `${base} text-slate-600 hover:bg-white`;

    return (
        <aside
            className="
        w-64 bg-shell border-r border-slate-200
        pt-8 pb-6 pl-6 pr-4 flex flex-col
      "
        >
            {/* LOGO */}
            <div className="flex items-center gap-3 mb-10 pl-2">
                <div
                    className="
            w-10 h-10 rounded-shell
            bg-gradient-to-br from-brand to-brand-dark
            flex items-center justify-center text-white shadow-card
          "
                >
                    <Headphones className="w-6 h-6" />
                </div>

                <div>
                    <div className="text-lg font-semibold text-slate-800">
                        Spelo Admin
                    </div>
                    <div className="text-[11px] text-slate-400 tracking-wider">
                        Dashboard
                    </div>
                </div>
            </div>

            {/* MENU HEADER */}
            <div className="px-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-3">
                Menu
            </div>

            {/* NAVIGATION */}
            <div className="flex flex-col gap-1">

                <NavLink to="/admin" className={linkClass} end>
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/admin/audio-processing" className={linkClass}>
                    <Workflow className="w-5 h-5" />
                    <span>Audio Processing</span>
                </NavLink>

                <NavLink to="/admin/lessons" className={linkClass}>
                    <BookOpen className="w-5 h-5" />
                    <span>Lessons</span>
                </NavLink>

                <NavLink to="/admin/audio-files" className={linkClass}>
                    <FileAudio2 className="w-5 h-5" />
                    <span>Audio Files</span>
                </NavLink>

                <NavLink to="/admin/users" className={linkClass}>
                    <Users className="w-5 h-5" />
                    <span>Users</span>
                </NavLink>

                <NavLink to="/admin/dictionary" className = {linkClass}>
                    <BookOpen className="w-5 h-5" />
                    <span>Dictionary</span>
                </NavLink>
            </div>

            {/* GENERAL HEADER */}
            <div className="px-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mt-8 mb-3">
                General
            </div>

            <div className="flex flex-col gap-1">
                <button className={`${base} text-slate-600 hover:bg-white`}>
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </button>

                <button className={`${base} text-slate-600 hover:bg-white`}>
                    <HelpCircle className="w-5 h-5" />
                    <span>Help</span>
                </button>

                <button className={`${base} text-slate-600 hover:bg-white`}>
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;