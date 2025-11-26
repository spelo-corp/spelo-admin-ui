import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-200/70 flex items-center justify-center px-4 py-6">
            <div
                className="
        flex w-full max-w-7xl h-[85vh]
        bg-shell rounded-shell shadow-shell overflow-hidden
        "
            >
                <Sidebar />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />

                    <main className="flex-1 overflow-y-auto px-8 py-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
