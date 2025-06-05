import api from "../api";

export const fetchUsers = ({ search = "", page = 1, pageSize = 10 } = {}) =>
    api.get("/users", { params: { search, page, pageSize } })
        .then(res => ({
            data: res.data.items,
            total: res.data.total,
            page: res.data.page,
            pageSize: res.data.pageSize
        }));

// สร้าง user ใหม่
export const createUser = (data) =>
    api.post("/users", data).then(res => res.data);

// แก้ไข user (role, อื่นๆ)
export const updateUser = (id, data) =>
    api.put(`/users/${id}`, data).then(res => res.data);

// ลบ user
export const deleteUser = (id) =>
    api.delete(`/users/${id}`).then(res => res.data);

// รีเซ็ตรหัสผ่าน (เช่น ใช้รหัสผ่าน default)
export const resetUserPassword = (id, newPassword = "123456") =>
    api.put(`/users/${id}/reset-password`, { newPassword }).then(res => res.data);

// ดึงข้อมูล user รายคน (option)
export const fetchUserById = (id) =>
    api.get(`/users/${id}`).then(res => res.data);
