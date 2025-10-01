import React, { useEffect, useState, useCallback } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Popconfirm,
    Card,
    Space,
    Tag,
    Typography
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SearchOutlined
} from "@ant-design/icons";
import * as userApi from "../api/user";
import { useAuth } from "../contexts/AuthContext";
import { useMessageApi } from "../contexts/MessageContext";

const { Title } = Typography;
const ROLE_OPTIONS = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" }
];

export default function UserManagement() {
    const { user } = useAuth();
    const messageApi = useMessageApi();

    const [resetUserId, setResetUserId] = useState(null);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [searchText, setSearchText] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    // --- Fetch users ---
    const fetchUsers = useCallback(async ({ search, page, pageSize } = {}) => {
        setLoading(true);
        try {
            const res = await userApi.fetchUsers({
                search: search !== undefined ? search : searchText,
                page: page !== undefined ? page : pagination.current,
                pageSize: pageSize !== undefined ? pageSize : pagination.pageSize
            });
            setUsers(res.data);
            setPagination({
                current: res.page,
                pageSize: res.pageSize,
                total: res.total
            });
        } catch (err) {
            messageApi.error(err.response?.data?.error || "โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, searchText, messageApi]);

    // --- Initial fetch or whenever pagination/search changes ---
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // --- Table pagination/change handler ---
    const handleTableChange = (pagination) => {
        fetchUsers({
            page: pagination.current,
            pageSize: pagination.pageSize
        });
    };

    // --- Search handler ---
    const handleSearch = (value) => {
        setSearchText(value);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchUsers({ search: value, page: 1 });
    };

    const openModal = (record = null) => {
        setEditingUser(record);
        if (record) {
            form.setFieldsValue({
                username: record.username,
                displayName: record.displayName,
                role: record.role,
            });
        } else {
            form.resetFields();
        }
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    // --- Add/Edit user handler ---
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (editingUser) {
                await userApi.updateUser(editingUser._id, values);
                messageApi.success("แก้ไขผู้ใช้สำเร็จ");
            } else {
                await userApi.createUser(values);
                messageApi.success("สร้างผู้ใช้สำเร็จ");
            }
            closeModal();
            fetchUsers({ page: 1 });
        } catch (err) {
            messageApi.error(err.response?.data?.error || "บันทึกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    // --- Delete user handler ---
    const handleDelete = async (id) => {
        setLoading(true);
        try {
            await userApi.deleteUser(id);
            messageApi.success("ลบผู้ใช้สำเร็จ");
            fetchUsers({ page: 1 });
        } catch (err) {
            messageApi.error(err.response?.data?.error || "ลบไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = (id) => {
        setResetUserId(id);
    };

    // --- Table columns ---
    const columns = [
        {
            title: "ชื่อผู้ใช้งาน",
            dataIndex: "username",
            key: "username"
        },
        {
            title: "ชื่อที่แสดง",
            dataIndex: "displayName",
            key: "displayName"
        },
        {
            title: "หน้าที่",
            dataIndex: "role",
            key: "role",
            render: (role) => (
                <Tag color={role === "admin" ? "geekblue" : "green"}>
                    {role.toUpperCase()}
                </Tag>
            )
        },
        {
            title: "#",
            key: "action",
            render: (_, record) => (
                <ActionButtons
                    record={record}
                    user={user}
                    onEdit={() => openModal(record)}
                    onResetPassword={() => handleResetPassword(record._id)}
                    onDelete={() => handleDelete(record._id)}
                />
            )
        }
    ];

    return (
        <Card style={{ maxWidth: 850, margin: "auto", marginTop: 20 }}>
            <Title level={3}>จัดการผู้ใช้</Title>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    icon={<PlusOutlined />}
                    type="primary"
                    onClick={() => openModal()}
                >
                    เพิ่มผู้ใช้
                </Button>
                <Input.Search
                    allowClear
                    enterButton={<SearchOutlined />}
                    placeholder="ค้นหา Username"
                    onSearch={handleSearch}
                    style={{ width: 220 }}
                    loading={loading}
                />
            </Space>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                bordered
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} จากทั้งหมด ${total} รายการ`
                }}
                onChange={handleTableChange}
            />
            <Modal
                open={modalOpen}
                title={editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}
                onCancel={closeModal}
                okText={editingUser ? "บันทึก" : "สร้าง"}
                onOk={() => form.submit()}
                confirmLoading={loading}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ role: "user" }}
                >
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: "กรุณากรอก Username" }]}
                    >
                        <Input disabled={!!editingUser} />
                    </Form.Item>

                    <Form.Item
                        label="ชื่อที่แสดง"
                        name="displayName"
                        rules={[{ required: true, message: "กรุณากรอกชื่อที่แสดง" }]}
                    >
                        <Input />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: "กรุณากรอกรหัสผ่าน" },
                                { min: 6, message: "รหัสผ่านอย่างน้อย 6 ตัว" }
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item
                        label="Role"
                        name="role"
                        rules={[{ required: true, message: "กรุณาเลือก Role" }]}
                    >
                        <Select options={ROLE_OPTIONS} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                open={!!resetUserId}
                title="รีเซ็ตรหัสผ่าน"
                okText="รีเซ็ต"
                cancelText="ยกเลิก"
                confirmLoading={loading}
                onCancel={() => setResetUserId(null)}
                onOk={async () => {
                    setLoading(true);
                    try {
                        await userApi.resetUserPassword(resetUserId, "123456");
                        messageApi.success("รีเซ็ตรหัสผ่านสำเร็จ (รหัสผ่านใหม่: 123456)");
                        setResetUserId(null);
                    } catch (err) {
                        messageApi.error("รีเซ็ตไม่สำเร็จ");
                    } finally {
                        setLoading(false);
                    }
                }}
            >
                <p>
                    ต้องการรีเซ็ตรหัสผ่านผู้ใช้นี้เป็นค่าเริ่มต้นหรือไม่? <br />
                    <b>รหัสผ่านใหม่: 123456</b>
                </p>
            </Modal>

        </Card>
    );
}

// --- Action buttons separated for clarity ---
function ActionButtons({ record, user, onEdit, onResetPassword, onDelete }) {
    return (
        <Space>
            <Button
                icon={<EditOutlined />}
                size="small"
                onClick={onEdit}
            >
                แก้ไข
            </Button>
            <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={() => onResetPassword(record._id)}
            >
                รีเซ็ตรหัสผ่าน
            </Button>
            <Popconfirm
                title="ยืนยันลบผู้ใช้นี้?"
                okText="ลบ"
                cancelText="ยกเลิก"
                onConfirm={onDelete}
                disabled={record.username === user.username}
            >
                <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    disabled={record.username === user.username}
                >
                    ลบ
                </Button>
            </Popconfirm>
        </Space>
    );
}
