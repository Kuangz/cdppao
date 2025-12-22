import React from "react";
import { Button, Form, Input, Checkbox, Typography } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMessageApi } from "../contexts/MessageContext";

const { Title } = Typography;

const Login = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const messageApi = useMessageApi();

    const onFinish = async (values) => {
        const result = await login(values.username, values.password, values.remember);
        console.log("Login result:", result); // จะเห็น log เสมอ

        if (result.success) {
            messageApi.success("เข้าสู่ระบบสำเร็จ!", 1);
            setTimeout(() => {
                if (result?.roleName === 'admin') navigate('/admin');
                else navigate('/dashboard');
            }, 900);
        } else {
            messageApi.error(result.error || "Login failed", 2);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "auto", marginTop: 60 }}>
            <Title level={2}>เข้าใช้งานระบบ</Title>
            <Form
                name="login_form"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: "โปรดกรอกชื่อผู้ใช้งาน" }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="ชื่อผู้ใชเงาน" autoFocus />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: "โปรดกรอกรหัสผ่าน" }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่าน" />
                </Form.Item>
                <Form.Item name="remember" valuePropName="checked">
                    <Checkbox>จดจำการเข้าสู่ระบบ</Checkbox>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        เข้าสู่ระบบ
                    </Button>
                </Form.Item>
            </Form>
            {/* <Button type="link" block onClick={() => navigate("/register")}>
                Register
            </Button> */}
        </div>
    );
};

export default Login;
