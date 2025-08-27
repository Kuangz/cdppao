import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getLayers, createLayer, updateLayer, deleteLayer } from '../api/layer';
import LayerForm from '../components/LayerForm';

const LayerManagement = () => {
    const [layers, setLayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLayer, setEditingLayer] = useState(null);
    const [form] = Form.useForm();

    const fetchLayers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getLayers();
            setLayers(res.data);
        } catch (error) {
            message.error('Failed to fetch layers.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLayers();
    }, [fetchLayers]);

    const showModal = (layer = null) => {
        setEditingLayer(layer);
        form.resetFields();
        if (layer) {
            form.setFieldsValue(layer);
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingLayer(null);
    };

    const handleFinish = async (values) => {
        try {
            if (editingLayer) {
                await updateLayer(editingLayer._id, values);
                message.success('Layer updated successfully!');
            } else {
                await createLayer(values);
                message.success('Layer created successfully!');
            }
            fetchLayers();
            handleCancel();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An error occurred.';
            message.error(errorMessage);
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteLayer(id);
            message.success('Layer deleted successfully!');
            fetchLayers();
        } catch (error) {
            message.error('Failed to delete layer.');
            console.error(error);
        }
    };

    const columns = [
        {
            title: 'Layer Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Geometry Type',
            dataIndex: 'geometryType',
            key: 'geometryType',
        },
        {
            title: 'Custom Fields',
            dataIndex: 'fields',
            key: 'fields',
            render: (fields) => fields.length
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => showModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this layer?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                style={{ marginBottom: 16 }}
            >
                Create Layer
            </Button>
            <Table
                columns={columns}
                dataSource={layers}
                loading={loading}
                rowKey="_id"
                bordered
                title={() => <h2>Layer Management</h2>}
            />
            <Modal
                title={editingLayer ? 'Edit Layer' : 'Create Layer'}
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={() => form.submit()}>
                        Submit
                    </Button>,
                ]}
            >
                <LayerForm form={form} onFinish={handleFinish} initialValues={editingLayer} />
            </Modal>
        </div>
    );
};

export default LayerManagement;
