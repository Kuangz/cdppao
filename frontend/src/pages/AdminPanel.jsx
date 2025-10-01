import React from "react";
import { Typography, Card, List } from "antd";
import { Link } from "react-router-dom";
import { AppstoreAddOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const adminLinks = [
    {
        title: "Manage Layers",
        description: "Define and manage data layers on the map.",
        path: "/admin/layers",
        icon: <AppstoreAddOutlined />
    },
    {
        title: "Manage Users",
        description: "Register new users and manage existing ones.",
        path: "/user-management",
        icon: <UserOutlined />
    }
];

const AdminPanel = () => {
    return (
        <div style={{ maxWidth: 800, margin: "auto", padding: '24px' }}>
            <Title level={2}>Admin Panel</Title>
            <Card>
                <List
                    itemLayout="horizontal"
                    dataSource={adminLinks}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={item.icon}
                                title={<Link to={item.path}>{item.title}</Link>}
                                description={item.description}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default AdminPanel;
