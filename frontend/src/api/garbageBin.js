// src/api/garbageBin.js
import api from "../api";
const SERVER_URL = process.env.IMAGE_URL || "http://localhost:5000";
console.log(process.env.IMAGE_URL)

const normalizePath = (raw) => {
    // 1) backslashes → forward slashes
    let p = raw.replace(/\\/g, "/");
    // 2) ensure it begins with a slash
    if (!p.startsWith("/")) p = "/" + p;
    return SERVER_URL + p;
};

// fetch all points
export const fetchBinPoints = () =>
    api.get("/garbage-bins").then((res) => {
        // assume res.data is an array
        const normalized = Array.isArray(res.data)
            ? res.data.map((pt) => ({
                ...pt,
                images: Array.isArray(pt.images)
                    ? pt.images.map(normalizePath)
                    : [],
            }))
            : [];
        return { data: normalized };
    });

// fetch nearby points
export const fetchBinPointNearBy = (lat, lng, radius = 500) =>
    api
        .get("/garbage-bins/nearby", { params: { lat, lng, radius } })
        .then((res) => {
            const normalized = Array.isArray(res.data)
                ? res.data.map((pt) => ({
                    ...pt,
                    images: Array.isArray(pt.images)
                        ? pt.images.map(normalizePath)
                        : [],
                }))
                : [];
            return { data: normalized };
        });

// fetch single point by id
export const fetchBinPoint = (id) =>
    api.get(`/garbage-bins/${id}`).then((res) => {
        const pt = res.data || {};
        return {
            data: {
                ...pt,
                images: Array.isArray(pt.images)
                    ? pt.images.map(normalizePath)
                    : [],
            },
        };
    });

// create and update just pass through FormData
export const createBinPoint = (data, images) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === "currentBin") {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    });
    images.forEach((img) => formData.append("images", img));
    return api.post("/garbage-bins", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const updateBinPoint = (id, data, images) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === "currentBin") {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    });
    images.forEach((img) => formData.append("images", img));
    return api.put(`/garbage-bins/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const deleteBinPoint = (id) => api.delete(`/garbage-bins/${id}`);

export const addBinHistory = (id, data) =>
    api.post(`/garbage-bins/${id}/history`, data);
