import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null; // หรือ spinner
    if (!user.username) return <Navigate to="/login" />;
    return user.role === "admin" ? children : <Navigate to="/dashboard" />;
};

export default AdminRoute;
