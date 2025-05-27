import api, { setAccessToken, rememberUser } from "./index";

export async function login(username, password, remember) {
    const res = await api.post("/api/auth/login", { username, password });
    setAccessToken(res.data.accessToken);
    rememberUser(res.data.username, res.data.role || "user", remember);
    return res.data;
}

export async function register(username, password) {
    return api.post("/api/auth/register", { username, password });
}

export async function logout() {
    await api.post("/api/auth/logout");
    setAccessToken("");
}
