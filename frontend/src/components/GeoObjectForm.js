import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, DatePicker, Button, Upload, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import LocationPicker from './LocationPicker';

// A wrapper to adapt the LocationPicker's {lat, lng} format to the form's GeoJSON format.
const GeoJSONLocationPicker = ({ value, onChange, geometryType }) => {
    // value is a GeoJSON geometry object, e.g., { type: 'Point', coordinates: [lng, lat] }
    // LocationPicker expects { lat, lng }

    const toPickerFormat = (geoJson) => {
        if (geoJson && geoJson.type === 'Point' && geoJson.coordinates) {
            return { lat: geoJson.coordinates[1], lng: geoJson.coordinates[0] };
        }
        return null;
    };

    const handlePickerChange = (latLng) => {
        if (latLng) {
            const geoJson = {
                type: 'Point', // For now, assume Point. Will need to handle Polygon/LineString later.
                coordinates: [latLng.lng, latLng.lat]
            };
            onChange(geoJson);
        }
    };

    // Note: This picker currently only visually supports picking a single point.
    // Drawing polygons or lines would require a more advanced map component.
    if (geometryType !== 'Point') {
        return <p>Location picking for {geometryType} is not yet supported in this form. Please define coordinates manually.</p>
    }

    return <LocationPicker value={toPickerFormat(value)} onChange={handlePickerChange} />;
};


const renderField = (field) => {
    const { label, name, type, required } = field;
    const rules = [{ required, message: `Please provide the ${label}!` }];

    switch (type) {
        case 'String':
            return (
                <Form.Item key={name} label={label} name={['properties', name]} rules={rules}>
                    <Input />
                </Form.Item>
            );
        case 'Number':
            return (
                <Form.Item key={name} label={label} name={['properties', name]} rules={rules}>
                    <InputNumber style={{ width: '100%' }} />
                </Form.Item>
            );
        case 'Boolean':
            return (
                <Form.Item key={name} label={label} name={['properties', name]} valuePropName="checked" rules={rules}>
                    <Switch />
                </Form.Item>
            );
        case 'Date':
            return (
                <Form.Item key={name} label={label} name={['properties', name]} rules={rules}>
                    <DatePicker showTime />
                </Form.Item>
            );
        default:
            return null;
    }
};

const GeoObjectForm = ({ form, layers, layer, onFinish, initialValues, onCancel }) => {
    const [selectedLayer, setSelectedLayer] = useState(layer);

    useEffect(() => {
        // If the layer prop changes (e.g., in edit mode), update the internal state
        if (layer) {
            setSelectedLayer(layer);
        }
    }, [layer]);

    const handleLayerChange = (layerId) => {
        const newSelectedLayer = layers.find(l => l._id === layerId);
        setSelectedLayer(newSelectedLayer);
        // Reset fields when layer changes to avoid carrying over old data
        form.resetFields(['properties']);
    };

    // Determine if we are in edit mode
    const isEditMode = !!initialValues;

    if (!isEditMode && !selectedLayer) {
        // In create mode, prompt to select a layer first
        return (
            <Form form={form} layout="vertical">
                 <Form.Item name="layerId" label="Layer" rules={[{ required: true, message: 'Please select a layer!' }]}>
                    <Select
                        placeholder="Select a layer to begin"
                        onChange={handleLayerChange}
                        options={layers.map(l => ({ label: l.name, value: l._id }))}
                    />
                </Form.Item>
                <p>Please select a layer to proceed.</p>
            </Form>
        );
    }

    const activeLayer = selectedLayer || layer;
    if (!activeLayer) {
        // This should not happen if logic is correct, but as a safeguard:
        return <p>Error: Layer information is missing.</p>
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            // initialValues is now controlled by form.setFieldsValue in the parent
        >
             <Form.Item name="layerId" label="Layer" rules={[{ required: true }]}>
                <Select
                    placeholder="Select a layer"
                    onChange={handleLayerChange}
                    options={layers.map(l => ({ label: l.name, value: l._id }))}
                    disabled={isEditMode}
                />
            </Form.Item>

            <Form.Item
                name="geometry"
                label="Location"
                rules={[{ required: true, message: 'Please select a location on the map.' }]}
            >
                <GeoJSONLocationPicker geometryType={layer.geometryType} />
            </Form.Item>

            <Form.Item
                name="images"
                label="Images"
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                    if (Array.isArray(e)) {
                        return e;
                    }
                    return e && e.fileList;
                }}
            >
                <Upload
                    listType="picture"
                    beforeUpload={() => false} // Prevent automatic upload
                    multiple
                >
                    <Button icon={<UploadOutlined />}>Select Images</Button>
                </Upload>
            </Form.Item>

            {layer.fields.map(field => renderField(field))}

            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Submit
                </Button>
            </Form.Item>
        </Form>
    );
};

export default GeoObjectForm;
