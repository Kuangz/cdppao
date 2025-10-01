import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMessageApi } from "./MessageContext";
import api, {
    setAccessToken,
    rememberUser,
    getRememberedUser,
    clearRememberedUser,
    setOnAuthError
} from "../api";
// 1. สร้าง context object
const AuthContext = createContext();

// 2. Hook ใช้ context นี้ในทุกคอมโพเนนต์
export const useAuth = () => useContext(AuthContext);

// 3. Provider
export const AuthProvider = ({ children }) => {


    const [user, setUser] = useState(() => {
        // เรียกจาก storage (user อาจเป็น {username, role})
        return getRememberedUser();
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const messageApi = useMessageApi();

    useEffect(() => {
        setOnAuthError(() => {
            messageApi.error("Session expired. Please login again.");
            setUser({ username: "", role: "", displayName: "" }); // reset auth state
            navigate("/login");
        });
    }, [navigate, messageApi]);

    const login = async (username, password, remember = false) => {
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { username, password });
            setAccessToken(res.data.accessToken);
            rememberUser(res.data.username, res.data.role || "user", res.data.displayName, remember);
            setUser({ username: res.data.username, role: res.data.role || "user", displayName: res.data.displayName });
            console.log(user)
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || "Login failed" };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await api.post("/auth/logout");
        } catch { }
        setAccessToken("");
        clearRememberedUser();
        setUser({ username: "", role: "", displayName: "" });
        setLoading(false);
    };

    const checkAuth = async () => {
        setLoading(true);
        try {
            const res = await api.get("/auth/me");
            setUser({ username: res.data.username, role: res.data.role, displayName: res.data.displayName });
            return true;
        } catch (e) {
            console.warn("checkAuth failed", e); // เพิ่ม debug
            setUser({ username: "", role: "", displayName: "" });
            return false;
        } finally {
            setLoading(false);
        }
    };


    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user?.username,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
