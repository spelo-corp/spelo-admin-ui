import React from "react";
import PageHeader from "../components/common/PageHeader";

const UsersPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Users"
                description="Manage user accounts and access (coming soon)."
            />
            <p className="text-sm text-slate-500">TODO: implement user management.</p>
        </div>
    );
};

export default UsersPage;
