// src/utils/imageHelpers.js
const SERVER_URL = import.meta.env?.VITE_IMAGE_URL || 'http://localhost:5000';

/** แปลงพาธ/URL จากแบ็กเอนด์ให้เป็น URL ที่เปิดดูได้ในเบราว์เซอร์ */
export const publicUrlFromPath = (p = '') => {
    if (!p) return '';
    const normalized = String(p).replace(/\\/g, '/');     // backslash → slash
    // ถ้าเป็น absolute URL อยู่แล้ว ก็ใช้เลย
    if (/^https?:\/\//i.test(normalized)) return normalized;
    // otherwise รวมกับ SERVER_URL
    return `${SERVER_URL.replace(/\/+$/, '')}/${normalized.replace(/^\/+/, '')}`;
};

/** เวลา submit ให้แบ็กเอนด์: ตัด SERVER_URL ออก ให้เหลือพาธเก็บจริง */
export const pathFromPublicUrl = (u = '') => {
    if (!u) return '';
    const base = SERVER_URL.replace(/\/+$/, '');
    return u.startsWith(base) ? u.slice(base.length + 1) : u; // ตัด "base/" ออก
};

/** แปลงรายการ URL/พาธเก่า → AntD Upload fileList[] (status: 'done') */
export const toUploadFileList = (urls = []) =>
    (urls || []).map((u, i) => {
        const url = publicUrlFromPath(u);
        const name = url.split('/').pop() || 'image';
        return { uid: `existing-${i}`, name, status: 'done', url };
    });

/**
 * รับค่า images ได้ทั้ง: AntD UploadFile[], File[], string[] (path/URL), หรือผสมกัน
 * คืน: { existing: string[], fresh: File[] }
 */
export const splitImages = (list) => {
    const existing = [];
    const fresh = [];
    (Array.isArray(list) ? list : []).forEach((item) => {
        // ไฟล์ใหม่จาก AntD
        if (item?.originFileObj instanceof File) {
            fresh.push(item.originFileObj);
            return;
        }
        // ไฟล์ใหม่ (File) ดิบๆ
        if (item instanceof File) {
            fresh.push(item);
            return;
        }
        // รูปเดิมจาก AntD
        if (item && typeof item.url === 'string') {
            existing.push(pathFromPublicUrl(item.url));
            return;
        }
        // พาธ/URL เป็นสตริงล้วน
        if (typeof item === 'string') {
            existing.push(item.replace(/\\/g, '/'));
        }
    });
    return { existing, fresh };
};

/** ตรวจสอบชนิดไฟล์และขนาด (MB) */
export const validateImageBeforeUpload = ({ file, maxMB = 10, types = ['image/jpeg', 'image/png', 'image/webp'] }) => {
    const okType = types.includes(file.type);
    if (!okType) return { ok: false, message: 'รองรับเฉพาะ JPEG/PNG/WebP' };

    const okSize = file.size / 1024 / 1024 <= maxMB;
    if (!okSize) return { ok: false, message: `ไฟล์ต้องไม่เกิน ${maxMB}MB` };

    return { ok: true };
};
