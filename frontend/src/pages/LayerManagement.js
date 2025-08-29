import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, message, Popconfirm, Space, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { getLayers, createLayer, updateLayer, deleteLayer, importLayer, uploadGeoJsonToLayer } from '../api/layer';
import LayerForm from '../components/LayerForm';

const LayerManagement = () => {
    const [layers, setLayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [uploadTargetLayer, setUploadTargetLayer] = useState(null);
    const [fileList, setFileList] = useState([]);
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

    const showImportModal = () => {
        setIsImportModalVisible(true);
    };

    const handleImportCancel = () => {
        setIsImportModalVisible(false);
        setFileList([]);
    };

    const handleImport = async () => {
        if (fileList.length === 0) {
            message.error("Please select a GeoJSON file to import.");
            return;
        }
        const formData = new FormData();
        formData.append('file', fileList[0]);

        setLoading(true);
        try {
            const res = await importLayer(formData);
            message.success(res.data.message || "Layer imported successfully!");
            handleImportCancel();
            fetchLayers();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to import layer.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const showUploadModal = (layer) => {
        setUploadTargetLayer(layer);
        setIsUploadModalVisible(true);
    };

    const handleUploadCancel = () => {
        setIsUploadModalVisible(false);
        setUploadTargetLayer(null);
        setFileList([]);
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.error("Please select a GeoJSON file to upload.");
            return;
        }
        if (!uploadTargetLayer) {
            message.error("No layer selected for upload.");
            return;
        }

        const formData = new FormData();
        formData.append('file', fileList[0]);

        setLoading(true);
        try {
            const res = await uploadGeoJsonToLayer(uploadTargetLayer._id, formData);
            message.success(res.data.message || "Layer data uploaded successfully!");
            handleUploadCancel();
            fetchLayers();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to upload data.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const uploadProps = {
        onRemove: file => {
            setFileList([]);
        },
        beforeUpload: file => {
            setFileList([file]);
            return false; // Prevent auto-upload
        },
        fileList,
        accept: ".geojson,.json",
        maxCount: 1,
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
                    <Button icon={<UploadOutlined />} onClick={() => showUploadModal(record)}>
                        Upload Data
                    </Button>
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
            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showModal()}
                >
                    Create Layer
                </Button>
                <Button
                    icon={<UploadOutlined />}
                    onClick={showImportModal}
                >
                    Import from GeoJSON
                </Button>
            </Space>
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
                width={{
                    xs: '90%',
                    sm: '80%',
                    md: '70%',
                    lg: '60%',
                    xl: '50%',
                    xxl: '40%',
                }}
                open={isModalVisible}
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
            <Modal
                title="Import Layer from GeoJSON"
                width={{
                    xs: '90%',
                    sm: '80%',
                    md: '70%',
                    lg: '60%',
                    xl: '50%',
                    xxl: '40%',
                }}
                open={isImportModalVisible}
                onOk={handleImport}
                onCancel={handleImportCancel}
                confirmLoading={loading}
                okText="Import"
            >
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>Click to select a .geojson file</Button>
                </Upload>
            </Modal>
            <Modal
                title={`Upload Data to ${uploadTargetLayer?.name}`}
                open={isUploadModalVisible}
                onOk={handleUpload}
                onCancel={handleUploadCancel}
                confirmLoading={loading}
                width={{
                    xs: '90%',
                    sm: '80%',
                    md: '70%',
                    lg: '60%',
                    xl: '50%',
                    xxl: '40%',
                }}
                okText="Upload"
            >
                <p>Upload a new GeoJSON file to overwrite the data for this layer. The file must be a FeatureCollection. Existing data will be deleted.</p>
                <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>Click to select a .geojson file</Button>
                </Upload>
                <h3 style={{ marginTop: 24 }}>Upload History</h3>
                <Table
                    size="small"
                    dataSource={uploadTargetLayer?.uploadHistory?.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))}
                    columns={[
                        { title: 'Filename', dataIndex: 'filename', key: 'filename' },
                        { title: 'Uploaded At', dataIndex: 'uploadedAt', key: 'uploadedAt', render: (text) => new Date(text).toLocaleString() },
                        { title: 'Uploaded By', dataIndex: 'uploadedBy', key: 'uploadedBy' },
                    ]}
                    rowKey="uploadedAt"
                    pagination={{ pageSize: 5 }}
                />
            </Modal>
        </div>
    );
};

export default LayerManagement;
