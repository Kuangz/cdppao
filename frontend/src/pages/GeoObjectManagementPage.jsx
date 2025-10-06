import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Table, message, Spin, Button, Modal, Popconfirm, Space, Form, Typography, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getLayerById } from '../api/layer';
import { getGeoObjectsByLayer, createGeoObject, updateGeoObject, deleteGeoObject } from '../api/geoObject';
import GeoObjectForm from '../components/GeoObjectForm';
import { splitImages, toUploadFileList } from '../utils/imageHelpers';

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
            setObjects(objectsRes.data || []);
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
                images: toUploadFileList(object.images || []), // preload สำหรับแก้ไข
            })
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingObject(null);
        form.resetFields();
    };

    const handleFinish = async (values) => {
        if (!layer?._id) {
            message.error('Layer not ready.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('layerId', layer._id);
            formData.append('geometry', JSON.stringify(values.geometry));
            formData.append('properties', JSON.stringify(values.properties || {}));

            console.log('Submitting values:', values.images);


            const { existing, fresh } = splitImages(values.images || []);
            fresh.forEach((file) => formData.append('images', file));

            if (editingObject) {
                if (existing.length > 0) {
                    existing.forEach(p => formData.append('existingImages', p));
                } else {
                    // <<== สัญญาณชัดเจนว่า "ไม่มีรูปเหลือ"
                    formData.append('existingImages', '');
                }
            } else {
                // create: ไม่ส่ง existingImages
            }

            if (editingObject) {
                await updateGeoObject(editingObject._id, formData);
                message.success('Object updated successfully!');
            } else {
                await createGeoObject(formData);
                message.success('Object created successfully!');
            }

            await fetchLayerDetails();
            handleCancel();
        } catch (error) {
            const errorMessage = error?.response?.data?.error || 'An error occurred.';
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
            await fetchLayerDetails();
        } catch (error) {
            message.error('Failed to delete object.');
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo(() => {
        if (!layer) return [];

        const importantFields = layer.displaySettings?.importantFields || [];
        const layerFields = layer.fields || [];

        const cols = importantFields.map((fieldName) => {
            const field = layerFields.find((f) => f.name === fieldName);
            return {
                title: field ? field.label : fieldName,
                dataIndex: ['properties', fieldName],
                key: fieldName,
                render: (val) => (val === null || val === undefined ? '-' : String(val)),
            };
        });

        if (cols.length === 0) {
            cols.push({ title: 'ID', dataIndex: '_id', key: '_id' });
        }

        cols.push({
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleShowModal(record)}
                        aria-label="Edit object"
                    />
                    <Popconfirm
                        title="Are you sure you want to delete this object?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button size="small" icon={<DeleteOutlined />} danger aria-label="Delete object" />
                    </Popconfirm>
                </Space>
            ),
        });

        return cols;
    }, [layer]);

    if (!layer) {
        return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;
    }

    return (
        <div style={{ padding: 8 }}>
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>
                    <Link to="/admin">Admin Panel</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to="/admin/layers">Layer Management</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>จัดการข้อมูล: {layer.name}</Breadcrumb.Item>
            </Breadcrumb>

            <Title level={2}>จัดการข้อมูล: {layer.name}</Title>

            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleShowModal()}>
                    Create Object
                </Button>
            </Space>

            <Table
                columns={columns}
                dataSource={objects}
                loading={loading}
                rowKey="_id"
                bordered
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: true }}
            />

            <Modal
                title={editingObject ? `แก้ไขข้อมูลของ ${layer.name}` : `สร้างข้อมูลใหม่ใน ${layer.name}`}
                open={isModalVisible}               // ✅ Antd v5
                onCancel={handleCancel}
                width={800}
                destroyOnHidden                     // ✅ Antd v5
                maskClosable={false}
                footer={null}
            >
                <GeoObjectForm
                    form={form}
                    layer={layer}
                    onFinish={handleFinish}
                    onCancel={handleCancel}
                    initialValues={editingObject}
                />
            </Modal>
        </div>
    );
};

export default GeoObjectManagementPage;
