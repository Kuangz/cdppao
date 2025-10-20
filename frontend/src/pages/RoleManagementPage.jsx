import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Space, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getRoles, deleteRole } from '../api/role';
import RoleForm from '../components/RoleForm'; // Assuming RoleForm component exists

const RoleManagementPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            message.error('Failed to fetch roles.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleAdd = () => {
        setEditingRole(null);
        setIsModalVisible(true);
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setIsModalVisible(true);
    };

    const handleDelete = async (roleId) => {
        try {
            await deleteRole(roleId);
            message.success('Role deleted successfully.');
            fetchRoles();
        } catch (error) {
            message.error('Failed to delete role.');
        }
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setEditingRole(null);
        fetchRoles(); // Refresh roles after modal closes
    };

    const columns = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space direction={isMobile ? 'vertical' : 'horizontal'}>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        {!isMobile && 'Edit'}
                    </Button>
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() =>
                            Modal.confirm({
                                title: 'Are you sure?',
                                content: `Do you want to delete the role "${record.name}"?`,
                                onOk: () => handleDelete(record._id),
                            })
                        }
                    >
                        {!isMobile && 'Delete'}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h1>Role Management</h1>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{ marginBottom: 16 }}
            >
                Add Role
            </Button>
            <Table
                columns={columns}
                dataSource={roles}
                loading={loading}
                rowKey="_id"
            />
            <Modal
                title={editingRole ? 'Edit Role' : 'Add Role'}
                visible={isModalVisible}
                onCancel={handleModalClose}
                footer={null}
                destroyOnClose
            >
                <RoleForm role={editingRole} onClose={handleModalClose} />
            </Modal>
        </div>
    );
};

export default RoleManagementPage;
