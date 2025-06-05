// src/utils/statusUtil.js

export const BIN_STATUS_MAP = {
    active: "ใช้งาน",
    broken: "ชำรุด",
    lost: "หาย",
    removed: "นำออก",
    replaced: "เปลี่ยน"
};

// สถานะที่เลือกใน select (UI)
export const BIN_STATUS_OPTIONS = Object.entries(BIN_STATUS_MAP).map(([value, label]) => ({
    value,
    label
}));

// Action ที่เลือกในฟอร์ม (อาจจะเหมือน status หรือ custom)
export const BIN_ACTIONS = [
    { value: "broken", label: "แจ้งเสีย" },
    { value: "lost", label: "แจ้งหาย" },
    { value: "removed", label: "ถอดถังออก" },
    { value: "replaced", label: "เปลี่ยนถังใหม่" }
];

// Action → Status (ฝั่ง logic)
export const ACTION_TO_STATUS = {
    broken: "broken",
    lost: "lost",
    removed: "removed",
    replaced: "active" // เปลี่ยนถังใหม่ = ถังใหม่พร้อมใช้งาน
};

// แปลง key → label
export function statusKeyToLabel(key) {
    return BIN_STATUS_MAP[key] || key;
}

// แปลง label → key (ใช้ในกรณีพิเศษ)
export function statusLabelToKey(label) {
    return Object.entries(BIN_STATUS_MAP).find(([k, v]) => v === label)?.[0] || label;
}

// Action ที่สามารถเลือกได้ (ป้องกันเลือก status เดิม)
export function getAvailableActions(currentStatus) {
    return BIN_ACTIONS.filter(
        a => ACTION_TO_STATUS[a.value] !== currentStatus
    );
}
