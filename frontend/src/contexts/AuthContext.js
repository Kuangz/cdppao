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
            setUser({ username: "", role: "" }); // reset auth state
            navigate("/login");
        });
    }, [navigate, messageApi]);

    const login = async (username, password, remember = false) => {
        setLoading(true);
        try {
            const res = await api.post("/api/auth/login", { username, password });
            console.log(res)
            setAccessToken(res.data.accessToken);
            rememberUser(res.data.username, res.data.role || "user", remember);
            setUser({ username: res.data.username, role: res.data.role || "user" });
            console.log(username)
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
            await api.post("/api/auth/logout");
        } catch { }
        setAccessToken("");
        clearRememberedUser();
        setUser({ username: "", role: "" });
        setLoading(false);
    };

    // สำหรับ check ว่ายัง login ไหม (optional ใช้กับ refresh token)
    const checkAuth = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/auth/me"); // ถ้ามี API นี้
            setUser({ username: res.data.username, role: res.data.role });
            return true;
        } catch {
            setUser({ username: "", role: "" });
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
