import React, { useState } from "react";
import { Button, Form, Input, Typography, Alert } from "antd";
import { LockOutlined } from "@ant-design/icons";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const { Title } = Typography;

const ChangePassword = () => {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const onFinish = async (values) => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            await api.post(
                "/auth/change-password",
                {
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword,
                }
            );
            setSuccess("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่");
            setTimeout(async () => {
                await logout(); // logout เพื่อ clear session และ context
                navigate("/login");
            }, 1500); // รอสักพักให้ user เห็นข้อความ success
            // หรือ navigate("/login"); // ถ้าอยากให้ redirect
        } catch (err) {
            setError(err.response?.data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "auto", marginTop: 60 }}>
            <Title level={3} style={{ textAlign: "center" }}>เปลี่ยนรหัสผ่าน</Title>
            <Form name="change_password" onFinish={onFinish} autoComplete="off" layout="vertical">
                <Form.Item
                    name="oldPassword"
                    label="รหัสผ่านเดิม"
                    rules={[{ required: true, message: "กรุณากรอกรหัสผ่านเดิม" }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่านเดิม" autoFocus />
                </Form.Item>
                <Form.Item
                    name="newPassword"
                    label="รหัสผ่านใหม่"
                    rules={[
                        { required: true, message: "กรุณากรอกรหัสผ่านใหม่" },
                        { min: 6, message: "รหัสผ่านใหม่อย่างน้อย 6 ตัว" },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่านใหม่" />
                </Form.Item>
                <Form.Item
                    name="confirmPassword"
                    label="ยืนยันรหัสผ่านใหม่"
                    dependencies={["newPassword"]}
                    rules={[
                        { required: true, message: "กรุณายืนยันรหัสผ่านใหม่" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("รหัสผ่านใหม่ไม่ตรงกัน"));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="ยืนยันรหัสผ่านใหม่" />
                </Form.Item>
                {error && (
                    <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
                )}
                {success && (
                    <Alert type="success" message={success} showIcon style={{ marginBottom: 16 }} />
                )}
                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        เปลี่ยนรหัสผ่าน
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default ChangePassword;
