import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null; // หรือ spinner
    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
