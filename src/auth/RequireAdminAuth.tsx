import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminLoggedIn } from "./adminAuth";

export const RequireAdminAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const location = useLocation();

    if (!isAdminLoggedIn()) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    return children;
};

