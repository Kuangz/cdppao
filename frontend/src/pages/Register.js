import React, { useState } from "react";
import { Button, Form, Input, Typography, Alert } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import api from "../api";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const Register = () => {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            await api.post("/auth/register", {
                username: values.username,
                password: values.password,
            });
            setSuccess("Register success! You can login now.");
        } catch (err) {
            setError(err.response?.data?.error || "Register failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "auto", marginTop: 60 }}>
            <Title level={2}>Register</Title>
            <Form name="register_form" onFinish={onFinish} autoComplete="off">
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: "Please input your Username!" }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Username" autoFocus />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: "Please input your Password!" }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>
                {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
                {success && <Alert type="success" message={success} showIcon style={{ marginBottom: 16 }} />}
                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Register
                    </Button>
                </Form.Item>
            </Form>
            <Button type="link" block onClick={() => navigate("/login")}>
                Login
            </Button>
        </div>
    );
};

export default Register;
