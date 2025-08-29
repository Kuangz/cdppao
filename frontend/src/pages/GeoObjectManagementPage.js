import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, message, Spin, Button, Modal, Popconfirm, Space, Form, Typography, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getLayerById } from '../api/layer';
import { getGeoObjectsByLayer, createGeoObject, updateGeoObject, deleteGeoObject } from '../api/geoObject';
import GeoObjectForm from '../components/GeoObjectForm';

const { Title } = Typography;

const GeoObjectManagementPage = () => {
    const { layerId } = useParams();
    const navigate = useNavigate();
    const [layer, setLayer] = useState(null);
    const [objects, setObjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingObject, setEditingObject] = useState(null);
    const [form] = Form.useForm();

    const fetchLayerDetails = useCallback(async () => {
        setLoading(true);
        try {
            const layerRes = await getLayerById(layerId);
            setLayer(layerRes.data);
            const objectsRes = await getGeoObjectsByLayer(layerId);
            setObjects(objectsRes.data);
        } catch (error) {
            message.error('Failed to fetch layer details or objects.');
            navigate('/admin/layers');
        } finally {
            setLoading(false);
        }
    }, [layerId, navigate]);

    useEffect(() => {
        fetchLayerDetails();
    }, [fetchLayerDetails]);

    const handleShowModal = (object = null) => {
        setEditingObject(object);
        form.resetFields();
        if (object) {
            form.setFieldsValue({
                ...object,
                properties: object.properties || {},
            });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingObject(null);
    };

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('layerId', layer._id);
            formData.append('geometry', JSON.stringify(values.geometry));
            formData.append('properties', JSON.stringify(values.properties || {}));

            if (values.images && values.images.length > 0) {
                 values.images.forEach(file => {
                    if (file.originFileObj) {
                        formData.append('images', file.originFileObj);
                    } else if (file.url) {
                        formData.append('existingImages', file.url);
                    }
                });
            }

            if (editingObject) {
                await updateGeoObject(editingObject._id, formData);
                message.success('Object updated successfully!');
            } else {
                await createGeoObject(formData);
                message.success('Object created successfully!');
            }
            fetchLayerDetails(); // Refetch everything
            handleCancel();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An error occurred.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            await deleteGeoObject(id);
            message.success('Object deleted successfully!');
            fetchLayerDetails(); // Refetch everything
        } catch (error) {
            message.error('Failed to delete object.');
        } finally {
            setLoading(false);
        }
    };

    const generateColumns = () => {
        if (!layer) return [];

        const importantFields = layer.displaySettings?.importantFields || [];
        const layerFields = layer.fields || [];

        const columns = importantFields.map(fieldName => {
            const field = layerFields.find(f => f.name === fieldName);
            return {
                title: field ? field.label : fieldName,
                dataIndex: ['properties', fieldName],
                key: fieldName,
                render: (text) => String(text),
            };
        });

        if (columns.length === 0) {
             columns.push({ title: 'ID', dataIndex: '_id', key: '_id' });
        }

        columns.push({
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleShowModal(record)} />
                    <Popconfirm
                        title="Are you sure you want to delete this object?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        });

        return columns;
    };

    if (!layer) {
        return <Spin size="large" style={{ display: 'block', marginTop: '50px' }} />;
    }

    return (
        <div style={{ padding: '24px' }}>
            <Breadcrumb style={{ marginBottom: '16px' }}>
                <Breadcrumb.Item><a href="/admin">Admin Panel</a></Breadcrumb.Item>
                <Breadcrumb.Item><a href="/admin/layers">Layer Management</a></Breadcrumb.Item>
                <Breadcrumb.Item>จัดการข้อมูล: {layer.name}</Breadcrumb.Item>
            </Breadcrumb>

            <Title level={2}>จัดการข้อมูล: {layer.name}</Title>

            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleShowModal()}
                >
                    Create Object
                </Button>
            </Space>

            <Table
                columns={generateColumns()}
                dataSource={objects}
                loading={loading}
                rowKey="_id"
                bordered
            />

            <Modal
                title={editingObject ? `Edit Object in ${layer.name}`: `Create New Object in ${layer.name}`}
                visible={isModalVisible}
                onCancel={handleCancel}
                width={800}
                destroyOnClose
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                        Submit
                    </Button>,
                ]}
            >
                <GeoObjectForm
                    form={form}
                    layer={layer}
                    onFinish={handleFinish}
                    initialValues={editingObject}
                />
            </Modal>
        </div>
    );
};

export default GeoObjectManagementPage;
