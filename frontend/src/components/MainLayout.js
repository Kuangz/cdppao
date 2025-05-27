import React from "react";
import { Layout, Menu, Button, Dropdown, Space, Grid } from "antd";
import { HomeOutlined, DeleteOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
const { useBreakpoint } = Grid;
const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const isLoggedIn = !!user?.username;
    const screens = useBreakpoint();
    const menuItems = [
        {
            key: "/dashboard",
            icon: <HomeOutlined />,
            label: <Link to="/dashboard">หน้าหลัก</Link>,
        },
        {
            key: "/garbage-bins",
            icon: <DeleteOutlined />,
            label: <Link to="/garbage-bins">จุดติดตั้งถังขยะ</Link>,
        }
    ];

    const userMenu = {
        items: [
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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        minWidth: 0,
                        flexShrink: 1,
                        marginRight: 16,
                    }}
                >
                    <Link
                        to="/"
                        style={{
                            color: "#01579b",
                            display: "flex",
                            alignItems: "center",
                            minWidth: 0,
                            textDecoration: "none",
                        }}
                    >
                        <DeleteOutlined style={{ fontSize: 22, marginRight: 6, flexShrink: 0 }} />
                        <span
                            style={{
                                fontWeight: "bold",
                                fontSize: screens.xs ? 14 : 20,
                                letterSpacing: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                minWidth: 0,
                                maxWidth: screens.xs ? 70 : 150,
                                display: "inline-block",
                            }}
                        >
                            Where is Bin?
                        </span>
                    </Link>
                </div>
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
                                {user.username}
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
            <Footer style={{ textAlign: "center", fontSize: 13, color: "#888" }}>
                © {new Date().getFullYear()} Phuket City | Where is Bin?
            </Footer>
        </Layout>
    );
};

export default MainLayout;
