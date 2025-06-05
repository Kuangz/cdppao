// ChangeBinStatusForm.js
import React, { useState } from "react";
import { Form, Input, Select, Button, Upload } from "antd";

// ปกติ import จาก utils หรือ config
const BIN_TYPE = [
    { value: 1, label: "ถังสีฟ้าทั่วไป" },
    { value: 2, label: "จุดคัดแยกขยะ" },
    { value: 3, label: "ถังขยะคอนเทนเนอร์" }
];

const STATUS_ACTIONS = [
    { value: "active", label: "ใช้งาน" },
    { value: "broken", label: "แจ้งชำรุด" },
    { value: "lost", label: "แจ้งหาย" },
    { value: "removed", label: "ถอดถังออก" },
    { value: "replaced", label: "เปลี่ยนถังใหม่" }
];

export default function ChangeBinStatusForm({
    initialSerial,
    userRole,
    initialSize,
    loading,
    currentStatus, // ใช้สำหรับ disable การเลือกสถานะเดิม
    onSubmit,
    onCancel
}) {
    const [form] = Form.useForm();
    const status = Form.useWatch("status", form);
    const [fileList, setFileList] = useState([]);
    const effectiveRole = userRole || "user";
    // Autofill หรือ reset field ตอนเลือกสถานะ
    const handleStatusChange = (statusVal) => {
        if (statusVal === "replaced") {
            form.setFieldsValue({ serial: "", size: undefined });
        } else {
            form.setFieldsValue({
                serial: initialSerial || "",
                size: initialSize || undefined,
            });
            setFileList([]); // เคลียร์รูปด้วยถ้าเปลี่ยนสถานะ
        }
    };

    const statusOptions = STATUS_ACTIONS
        .filter(opt => {
            // 1. ถ้ายังไม่เคยมีสถานะ → เหลือแค่ replaced ทุก role
            if (!currentStatus) return opt.value === "replaced";

            // 2. ถ้า currentStatus เป็น removed → เหลือแค่ replaced ทุก role
            if (currentStatus === "removed") return opt.value === "replaced";

            // 3. user: ไม่มี active/removed
            if (effectiveRole === "user" && opt.value === "removed")
                return false;

            // 4. นอกนั้น แสดงได้หมด
            return true;
        })
        .map(opt => ({
            ...opt,
            // disabled ซ้ำสถานะเดิม
            disabled: opt.value === currentStatus
        }));


    const handleFinish = (values) => {
        // ส่งไฟล์รูปเฉพาะตอน replaced

        const submitData = {
            ...values,
            images: fileList ? fileList.map(f => f.originFileObj).filter(Boolean) : [],
        };

        onSubmit && onSubmit(submitData);
    };


    // handle อัปโหลด
    const handleUploadChange = ({ fileList: newList }) => {
        setFileList(newList.slice(-5)); // limit 5
    };

    React.useEffect(() => {
        form.setFieldsValue({
            status: "",
            serial: initialSerial || "",
            size: initialSize || undefined,
            note: ""
        });
    }, [initialSerial, initialSize, form]);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            <Form.Item
                label="สถานะ"
                name="status"
                rules={[{ required: true, message: "กรุณาเลือกเหตุการณ์" }]}
            >
                <Select
                    options={statusOptions}
                    size="large"
                    placeholder="เลือกเหตุการณ์"
                    onChange={handleStatusChange}
                />
            </Form.Item>
            <Form.Item
                label="รหัสถัง"
                name="serial"
                rules={[{ required: true, message: "กรุณากรอกรหัสถัง" }]}
            >
                <Input
                    placeholder="รหัสถัง"
                    size="large"
                    disabled={status !== "replaced"}
                />
            </Form.Item>
            <Form.Item
                label="ขนาด"
                name="size"
                rules={[{ required: true, message: "กรุณาเลือกขนาด" }]}
            >
                <Select
                    options={BIN_TYPE}
                    placeholder="เลือกประเภทถัง"
                    size="large"
                    disabled={status !== "replaced"}
                />
            </Form.Item>


            <Form.Item
                label="แนบรูปถังขยะ"
                extra="อัปโหลดได้สูงสุด 5 รูป"
                name="images" // ต้องใส่ name ด้วย

                rules={[
                    () => ({
                        validator(_, value) {

                            if (status === "replaced" && (!value || value.length === 0)) {
                                return Promise.reject(new Error("กรุณาแนบรูปถังขยะอย่างน้อย 1 รูป"));
                            }
                            return Promise.resolve();
                        }
                    }),
                ]}
            >
                <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={() => false} // ไม่อัปโหลดอัตโนมัติ
                    maxCount={5}
                    accept="image/*"
                >
                    {fileList.length >= 5 ? null : (
                        <div>
                            <div>เพิ่มรูป</div>
                        </div>
                    )}
                </Upload>
            </Form.Item>


            <Form.Item label="หมายเหตุ" name="note">
                <Input.TextArea rows={2} placeholder="หมายเหตุ (ถ้ามี)" />
            </Form.Item>
            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                    disabled={loading}
                >
                    บันทึกสถานะ
                </Button>
                <Button
                    style={{ marginTop: 8 }}
                    block
                    onClick={onCancel}
                    disabled={loading}
                >
                    ยกเลิก
                </Button>
            </Form.Item>
        </Form>
    );
}
