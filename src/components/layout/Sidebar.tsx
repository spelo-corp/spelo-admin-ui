import {
    BookA,
    BookOpen,
    ChevronDown,
    FileAudio2,
    Folder,
    GitFork,
    Headphones,
    HelpCircle,
    Home,
    Layers,
    Library,
    LogOut,
    MessageSquare,
    Settings,
    UserCircle,
    Users,
    Workflow,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { adminLogout } from "../../auth/adminAuth";

interface NavGroup {
    label: string;
    prefix: string;
    items: { to: string; icon: React.ReactNode; label: string; end?: boolean }[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: "Content",
        prefix: "/admin/lessons,/admin/books,/admin/categories,/admin/collections,/admin/dictionary",
        items: [
            { to: "/admin/lessons", icon: <BookOpen className="w-4.5 h-4.5" />, label: "Lessons" },
            { to: "/admin/books", icon: <Library className="w-4.5 h-4.5" />, label: "Books" },
            {
                to: "/admin/categories",
                icon: <Layers className="w-4.5 h-4.5" />,
                label: "Categories",
            },
            {
                to: "/admin/collections",
                icon: <Folder className="w-4.5 h-4.5" />,
                label: "Collections",
            },
            {
                to: "/admin/dictionary",
                icon: <BookA className="w-4.5 h-4.5" />,
                label: "Dictionary",
            },
        ],
    },
    {
        label: "Dialogue",
        prefix: "/admin/dialogues",
        items: [
            {
                to: "/admin/dialogues",
                icon: <MessageSquare className="w-4.5 h-4.5" />,
                label: "Scenarios",
                end: true,
            },
            {
                to: "/admin/dialogues/characters",
                icon: <UserCircle className="w-4.5 h-4.5" />,
                label: "Characters",
            },
        ],
    },
    {
        label: "Processing",
        prefix: "/admin/jobs,/admin/pipelines,/admin/audio-files",
        items: [
            { to: "/admin/jobs", icon: <Workflow className="w-4.5 h-4.5" />, label: "Jobs" },
            {
                to: "/admin/pipelines",
                icon: <GitFork className="w-4.5 h-4.5" />,
                label: "Pipelines",
            },
            {
                to: "/admin/audio-files",
                icon: <FileAudio2 className="w-4.5 h-4.5" />,
                label: "Audio Files",
            },
        ],
    },
];

function isGroupActive(prefix: string, pathname: string) {
    return prefix.split(",").some((p) => pathname.startsWith(p));
}

const Sidebar: React.FC = () => {
    const location = useLocation();

    const base =
        "flex items-center gap-3 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors";
    const subBase =
        "flex items-center gap-3 pl-10 pr-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors";

    const linkClass = (isActive: boolean) =>
        isActive
            ? `${base} bg-gradient-to-r from-brand to-brand-dark text-white shadow-sm`
            : `${base} text-slate-600 hover:bg-white`;

    const subLinkClass = (isActive: boolean) =>
        isActive
            ? `${subBase} text-brand font-semibold bg-brand/5`
            : `${subBase} text-slate-500 hover:text-slate-700 hover:bg-slate-50`;

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            adminLogout();
        }
    };

    return (
        <aside className="w-60 bg-shell border-r border-slate-200 pt-7 pb-6 pl-5 pr-4 flex flex-col overflow-y-auto">
            {/* LOGO */}
            <div className="flex items-center gap-3 mb-8 pl-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white shadow-sm">
                    <Headphones className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-base font-semibold text-slate-800">Spelo</div>
                    <div className="text-[10px] text-slate-400 tracking-wider">Admin</div>
                </div>
            </div>

            {/* DASHBOARD */}
            <NavLink to="/admin" className={({ isActive }) => linkClass(isActive)} end>
                <Home className="w-4.5 h-4.5" />
                <span>Dashboard</span>
            </NavLink>

            {/* GROUPED NAV */}
            <div className="flex flex-col gap-0.5 mt-1">
                {NAV_GROUPS.map((group) => (
                    <NavSection
                        key={group.label}
                        group={group}
                        pathname={location.pathname}
                        subLinkClass={subLinkClass}
                    />
                ))}
            </div>

            {/* USERS (standalone) */}
            <NavLink
                to="/admin/users"
                className={({ isActive }) => `${linkClass(isActive)} mt-0.5`}
            >
                <Users className="w-4.5 h-4.5" />
                <span>Users</span>
            </NavLink>

            {/* SPACER */}
            <div className="flex-1" />

            {/* GENERAL */}
            <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-4 mt-4">
                <button className={`${base} text-slate-500 hover:bg-white`}>
                    <Settings className="w-4.5 h-4.5" />
                    <span>Settings</span>
                </button>
                <button className={`${base} text-slate-500 hover:bg-white`}>
                    <HelpCircle className="w-4.5 h-4.5" />
                    <span>Help</span>
                </button>
                <button
                    onClick={handleLogout}
                    className={`${base} text-slate-500 hover:bg-white w-full text-left`}
                >
                    <LogOut className="w-4.5 h-4.5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

/** Collapsible nav section */
function NavSection({
    group,
    pathname,
    subLinkClass,
}: {
    group: NavGroup;
    pathname: string;
    subLinkClass: (isActive: boolean) => string;
}) {
    const active = isGroupActive(group.prefix, pathname);
    const [open, setOpen] = useState(active);

    // Auto-open when navigating into the group
    if (active && !open) {
        setOpen(true);
    }

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[14px] font-medium transition-colors w-full ${
                    active ? "text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-white"
                }`}
            >
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
                />
            </button>

            {open && (
                <div className="flex flex-col gap-0.5 pb-1">
                    {group.items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => subLinkClass(isActive)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Sidebar;
