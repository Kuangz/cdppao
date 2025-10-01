import React from "react";
import { Badge } from "antd";

// สถานะกับสีและคำแปล
const STATUS_MAP = {
    active: { label: "ใช้งาน", color: "#388e3c", badge: "success" },
    broken: { label: "ชำรุด", color: "#e53935", badge: "error" },
    lost: { label: "หาย", color: "#ffa726", badge: "warning" },
    removed: { label: "นำออก", color: "#616161", badge: "default" },
    replaced: { label: "เปลี่ยนถัง", color: "#1976d2", badge: "processing" },
    installed: { label: "ติดตั้ง", color: "#00bcd4", badge: "success" },
    deleted: { label: "ลบ", color: "#bdbdbd", badge: "default" },
};


export default function StatusBadge({ status, style }) {
    const info = STATUS_MAP[status] || { label: "ไม่มีข้อมูล", color: "#bdbdbd", badge: "default" };

    return (
        <Badge
            status={info.badge}
            color={info.color}
            text={<span style={{ fontWeight: 500 }}>{info.label}</span>}
            style={{ ...style }}
        />
    );
}
