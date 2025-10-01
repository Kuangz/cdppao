import React from "react";
import { Layout, Menu, Button, Dropdown, Space } from "antd";
import { DeleteOutlined, UserOutlined, LogoutOutlined, SettingOutlined, AppstoreAddOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const isLoggedIn = !!user?.username;

    const menuItems = [
        {
            key: "/dashboard",
            icon: <DeleteOutlined />,
            label: <Link to="/dashboard">ระบบฐานข้อมูล City Data Platform</Link>,
        },
    ];

    if (user?.role === 'admin') {
        menuItems.push({
            key: "/admin",
            icon: <AppstoreAddOutlined />,
            label: <Link to="/admin">Admin Panel</Link>,
        });
    }

    const userMenu = {
        items: [
            {
                key: "change-password",
                icon: <SettingOutlined />,
                label: <Link to="/change-password">เปลี่ยนรหัสผ่าน</Link>
            },
            {
                key: "user-management",
                icon: <UserOutlined />,
                label: <Link to="/user-management">จัดการผู้ใช้</Link>,
                hidden: user?.role !== "admin"
            },
            {
                type: "divider"
            },

            {
                key: "logout",
                icon: <LogoutOutlined />,
                label: <span onClick={logout}>ออกจากระบบ</span>
            }
        ]
    };

    return (
        <Layout style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Header
                style={{
                    background: "#fff",
                    borderBottom: "1px solid #f0f0f0",
                    padding: "0 8px",
                    position: "sticky",
                    top: 0,
                    zIndex: 1100,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Menu
                    theme="light"
                    mode="horizontal"
                    selectedKeys={[location.pathname]}
                    style={{ flex: 1, borderBottom: "none" }}
                    items={menuItems}
                />

                {isLoggedIn && (
                    <Dropdown menu={userMenu} placement="bottomRight" arrow>
                        <Button
                            type="text"
                            icon={<UserOutlined />}
                            style={{ marginLeft: 16, fontWeight: "bold" }}
                        >
                            <Space>
                                {user.displayName || user.username}
                            </Space>
                        </Button>
                    </Dropdown>
                )}

            </Header>
            <Content
                style={{
                    flex: 1,
                    padding: "8px 8px 8px 8px",
                    background: "#f6f8fa",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{ flex: 1 }}>{children}</div>
            </Content>
        </Layout>
    );
};

export default MainLayout;
