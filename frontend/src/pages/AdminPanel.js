import React from "react";
import { Typography, Table, Tag } from "antd";

const { Title } = Typography;

const usersMock = [
    { key: 1, username: "admin", role: "admin" },
    { key: 2, username: "user1", role: "user" },
    { key: 3, username: "user2", role: "user" },
];

const columns = [
    {
        title: "Username",
        dataIndex: "username",
        key: "username",
    },
    {
        title: "Role",
        dataIndex: "role",
        key: "role",
        render: (role) =>
            role === "admin" ? <Tag color="red">Admin</Tag> : <Tag color="blue">User</Tag>,
    },
];

const AdminPanel = () => {
    // ในโปรดักชัน fetch users จริงจาก backend ได้
    return (
        <div style={{ maxWidth: 700, margin: "auto", marginTop: 60 }}>
            <Title level={2}>Admin Panel</Title>
            <Table
                dataSource={usersMock}
                columns={columns}
                pagination={false}
                style={{ marginTop: 32 }}
            />
        </div>
    );
};

export default AdminPanel;
