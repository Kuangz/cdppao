import axios from "axios";

const REMEMBER_KEY = "rememberMe";
const USER_KEY = "username";
const ROLE_KEY = "role";
let accessToken = localStorage.getItem("accessToken") || "";
let onAuthError = null;
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export const setOnAuthError = (fn) => { onAuthError = fn; };

// --- สร้าง instance
const api = axios.create({
    baseURL: SERVER_URL, // แก้ตาม backend จริง
    withCredentials: true,
});

// --- Interceptor ใส่ accessToken อัตโนมัติ
api.interceptors.request.use(
    config => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// --- Interceptor กรณี token หมดอายุ
api.interceptors.response.use(
    res => res,
    async error => {
        const originalRequest = error.config;
        const loginUrls = [
            "/api/auth/login",
            "/api/auth/register"
        ];

        if (error.response
            && error.response.status === 401
            && !originalRequest._retry
            && !loginUrls.some(url => originalRequest.url.endsWith(url))
        ) {
            originalRequest._retry = true;
            try {
                const res = await axios.post(
                    "http://localhost:5000/api/auth/refresh",
                    {},
                    { withCredentials: true }
                );
                accessToken = res.data.accessToken;
                localStorage.setItem("accessToken", accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                accessToken = "";
                localStorage.removeItem("accessToken");
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(ROLE_KEY);
                localStorage.removeItem(REMEMBER_KEY);
                // 👇 เรียก callback แทน redirect
                if (onAuthError) onAuthError();
                // ไม่ต้อง window.location.href แล้ว!
            }
        }
        return Promise.reject(error);
    }
);

// --- Helper ฟังก์ชันสำหรับจำ user
export const setAccessToken = (token) => {
    accessToken = token;
    if (token) localStorage.setItem("accessToken", token);
    else localStorage.removeItem("accessToken");
};

export const rememberUser = (username, role, remember) => {
    if (remember) {
        console.log(remember)
        localStorage.setItem(USER_KEY, username);
        localStorage.setItem(ROLE_KEY, role);
        localStorage.setItem(REMEMBER_KEY, "1");
    } else {
        sessionStorage.setItem(USER_KEY, username);
        sessionStorage.setItem(ROLE_KEY, role);
        localStorage.removeItem(REMEMBER_KEY);
    }
};

export const getRememberedUser = () => {
    if (localStorage.getItem(REMEMBER_KEY)) {
        return {
            username: localStorage.getItem(USER_KEY) || "",
            role: localStorage.getItem(ROLE_KEY) || "user"
        };
    }
    return {
        username: sessionStorage.getItem(USER_KEY) || "",
        role: sessionStorage.getItem(ROLE_KEY) || "user"
    };
};

export const clearRememberedUser = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ROLE_KEY);
};

export default api;
