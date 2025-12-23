import React, { useState, useEffect } from 'react';
import { Form, Select, Card, Typography } from 'antd';
import { getLayers } from '../api/layer';
import { createGeoObject } from '../api/geoObject';
import GeoObjectForm from '../components/GeoObjectForm';
import { useNavigate } from 'react-router-dom';
import { useMessageApi } from '../contexts/MessageContext';

const { Option } = Select;
const { Title } = Typography;

const GeoObjectCreatePage = () => {
    const [layers, setLayers] = useState([]);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const messageApi = useMessageApi();

    useEffect(() => {
        const fetchLayersData = async () => {
            try {
                const res = await getLayers();
                setLayers(res.data);
            } catch (error) {
                messageApi.error('Failed to fetch layers.');
            }
        };
        fetchLayersData();
    }, []);

    const handleLayerChange = (layerId) => {
        const layer = layers.find(l => l._id === layerId);
        setSelectedLayer(layer);
        form.resetFields(); // Reset form when layer changes
    };

    const handleFinish = async (values) => {
        if (!selectedLayer) {
            messageApi.error('Something went wrong. No layer is selected.');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('layerId', selectedLayer._id);
            formData.append('geometry', JSON.stringify(values.geometry));
            formData.append('properties', JSON.stringify(values.properties || {}));

            if (values.images && values.images.length > 0) {
                values.images.forEach(file => {
                    formData.append('images', file.originFileObj);
                });
            }

            await createGeoObject(formData);
            messageApi.success(`New object created in layer "${selectedLayer.name}" successfully!`);
            navigate('/dashboard');
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to create object.';
            messageApi.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: 'auto', padding: '24px' }}>
            <Card>
                <Title level={2}>Add New Data to a Layer</Title>
                <Form.Item label="Select a Layer to Add Data To">
                    <Select
                        placeholder="Choose a layer"
                        onChange={handleLayerChange}
                        value={selectedLayer?._id}
                        style={{ width: '100%' }}
                    >
                        {layers.map(l => (
                            <Option key={l._id} value={l._id}>{l.name} ({l.geometryType})</Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedLayer && (
                    <GeoObjectForm
                        form={form}
                        layer={selectedLayer}
                        onFinish={handleFinish}
                        loading={loading}
                    />
                )}
            </Card>
        </div>
    );
};

export default GeoObjectCreatePage;
