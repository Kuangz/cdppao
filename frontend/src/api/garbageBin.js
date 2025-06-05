// src/api/garbageBin.js
import api from "../api";
const SERVER_URL = process.env.REACT_APP_IMAGE_URL || "http://localhost:5000";

// Convert \ → /, เติม SERVER_URL ถ้ายังไม่มี
const normalizePath = (raw) => {
    if (!raw) return "";
    let p = raw.replace(/\\/g, "/");
    if (!p.startsWith("/")) p = "/" + p;
    return SERVER_URL + p;
};

export function normalizePointImages(point) {
    if (!point) return point;

    return {
        ...point,
        images: Array.isArray(point.images)
            ? point.images.map(normalizePath)
            : [],
        currentBin: point.currentBin
            ? {
                ...point.currentBin,
                imageUrls: Array.isArray(point.currentBin.imageUrls)
                    ? point.currentBin.imageUrls.map(normalizePath)
                    : [],
            }
            : undefined,
        history: Array.isArray(point.history)
            ? point.history.map(h => ({
                ...h,
                bin: h.bin
                    ? {
                        ...h.bin,
                        imageUrls: Array.isArray(h.bin.imageUrls)
                            ? h.bin.imageUrls.map(normalizePath)
                            : [],
                    }
                    : undefined,
            }))
            : [],
    };
}

// -- helper: strip host (เวลาส่งกลับ server)
const stripHost = (url) => {
    const match = url.match(/(\/uploads\/garbage_bins\/.+)$/);
    return match ? match[1] : url;
};

// fetch all points (array)
export const fetchBinPoints = ({ search = "", page = 1, pageSize = 10, status } = {}) =>
    api.get("/garbage-bins", {
        params: { search, page, pageSize, status }
    }).then((res) => {
        const { ...resData } = res.data

        const normalized = Array.isArray(resData.items)
            ? resData.items.map(normalizePointImages)
            : [];
        return {
            data: normalized,
            total: resData.total,
            page: resData.page,
            pageSize: resData.pageSize
        };
    });

// fetch nearby points (array)
export const fetchBinPointNearBy = (lat, lng, radius = 500) =>
    api
        .get("/garbage-bins/nearby", { params: { lat, lng, radius } })
        .then((res) => {
            const normalized = Array.isArray(res.data)
                ? res.data.map(normalizePointImages)
                : [];
            return { data: normalized };
        });

// fetch single point by id (object)
export const fetchBinPoint = (id) =>
    api.get(`/garbage-bins/${id}`).then((res) => ({
        data: normalizePointImages(res.data || {}),
    }));

// create point (multipart)
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

// update point (multipart)
export const updateBinPoint = (id, data, images) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === "currentBin") {
            formData.append(key, JSON.stringify(value));
        } else if (key === "existingImages" && Array.isArray(value)) {
            // Strip host ทุกอัน ก่อนส่ง
            value.forEach(v => formData.append("existingImages", stripHost(v)));
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

// เปลี่ยนสถานะถัง/แจ้งเหตุการณ์ (object)
// แปลง images ของ point ที่ backend return ให้ทันที
export const changeBinStatus = (id, data) => {
    // ถ้ามี images เป็น Array ของ File object ให้ใช้ FormData
    let sendData = data;

    if (data.images && Array.isArray(data.images) && data.images[0] instanceof File) {
        const formData = new FormData();
        // แนบ field ทั่วไป
        Object.entries(data).forEach(([key, value]) => {
            if (key === "images") {
                value.forEach(file => formData.append("images", file));
            } else {
                formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
            }
        });
        sendData = formData;
    }

    return api
        .post(`/garbage-bins/${id}/status`, sendData, sendData instanceof FormData
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : {})
        .then(res => ({
            ...res,
            data: res.data ? normalizePointImages(res.data) : res.data,
        }));
};

export const fetchBinPointsForMap = () =>
    api.get("/garbage-bins/map").then(res => ({ data: res.data || [] }));
