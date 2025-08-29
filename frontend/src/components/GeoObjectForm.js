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

const GeoObjectForm = ({ form, layer, onFinish, initialValues }) => {

    // Determine if we are in edit mode
    const isEditMode = !!initialValues;

    if (!layer) {
        return <p>Error: Layer information is missing.</p>
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            {/* The layer is fixed, so we don't need a layer selector */}
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

            {/* The submit button is now in the modal footer */}
        </Form>
    );
};

export default GeoObjectForm;
