import type React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AdminLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-200/70 flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Right side */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
