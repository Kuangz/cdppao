import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Form, Input, InputNumber, Switch, DatePicker, Button, Upload, Select, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import LocationPicker from './LocationPicker';
import { publicUrlFromPath, toUploadFileList, validateImageBeforeUpload } from '../utils/imageHelpers';

/** ========== GeoJSONLocationPicker ========== */
const GeoJSONLocationPicker = ({ value, onChange, geometryType, isEditMode }) => {
    const toPickerFormat = (geoJson) => {
        if (geoJson && geoJson.type === 'Point' && Array.isArray(geoJson.coordinates)) {
            return { lat: geoJson.coordinates[1], lng: geoJson.coordinates[0] };
        }
        return null;
    };

    const handlePickerChange = (latLng) => {
        if (!latLng) return;
        onChange({
            type: 'Point',
            coordinates: [latLng.lng, latLng.lat],
        });
    };

    if (geometryType !== 'Point') {
        return (
            <p>
                Location picking for {geometryType || 'Unknown'} is not supported yet. Please provide
                coordinates manually.
            </p>
        );
    }

    return (
        <LocationPicker
            value={toPickerFormat(value)}
            onChange={handlePickerChange}
            isEditMode={isEditMode}
        />
    );
};

/** ========== Dynamic field renderer ========== */
const renderField = (field) => {
    const { label, name, type, required } = field || {};
    if (!name) return null;

    const rules = required ? [{ required: true, message: `Please provide the ${label || name}!` }] : [];

    switch (type) {
        case 'String':
            return (
                <Form.Item key={name} label={label || name} name={['properties', name]} rules={rules}>
                    <Input />
                </Form.Item>
            );
        case 'Number':
            return (
                <Form.Item key={name} label={label || name} name={['properties', name]} rules={rules}>
                    <InputNumber style={{ width: '100%' }} />
                </Form.Item>
            );
        case 'Boolean':
            return (
                <Form.Item
                    key={name}
                    label={label || name}
                    name={['properties', name]}
                    valuePropName="checked"
                    rules={rules}
                >
                    <Switch />
                </Form.Item>
            );
        case 'Date':
            return (
                <Form.Item key={name} label={label || name} name={['properties', name]} rules={rules}>
                    <DatePicker showTime />
                </Form.Item>
            );
        default:
            return null;
    }
};

/** ========== MAIN FORM ========== */
const GeoObjectForm = ({ form, layers = [], layer = null, onFinish, initialValues, onCancel }) => {
    // edit mode: มี layer (ล็อก), create mode: ไม่มี layer แต่มี layers ให้เลือก
    const isEditMode = !!layer;

    // preload images เมื่อแก้ไข (initialValues.images เป็นพาธ/URL จากแบ็กเอนด์)
    useEffect(() => {
        if (initialValues?.images?.length) {
            form.setFieldsValue({
                images: toUploadFileList(initialValues.images),
            });
        }
    }, [initialValues?.images, form]);

    // single source of truth สำหรับเลเยอร์ที่เลือก
    const [selectedLayerId, setSelectedLayerId] = useState(() => {
        if (isEditMode) return layer?._id || null;
        return initialValues?.layerId || null;
    });

    // รวม options จาก layers และ (ถ้าจำเป็น) layer ปัจจุบันตอนแก้ไข
    const selectOptions = useMemo(() => {
        const list = Array.isArray(layers) ? [...layers] : [];
        if (isEditMode && layer && !list.some((l) => l._id === layer._id)) {
            list.unshift(layer); // ให้แน่ใจว่ามีเลเยอร์ที่กำลังแก้ไขอยู่ใน options
        }
        return list;
    }, [layers, isEditMode, layer]);

    // หา activeLayer จาก selectedLayerId หรือจาก prop layer (ตอนแก้ไข)
    const activeLayer = useMemo(() => {
        if (isEditMode) return layer;
        return selectOptions.find((l) => l._id === selectedLayerId) || null;
    }, [isEditMode, layer, selectOptions, selectedLayerId]);

    /** ซิงก์ค่า layerId ในฟอร์มเมื่อเปลี่ยนโหมด/เปลี่ยนเลเยอร์ */
    useEffect(() => {
        if (isEditMode) {
            form.setFieldsValue({ layerId: layer?._id });
            setSelectedLayerId(layer?._id || null);
        } else {
            if (initialValues?.layerId) {
                setSelectedLayerId(initialValues.layerId);
                form.setFieldsValue({ layerId: initialValues.layerId });
            } else if (!selectedLayerId && selectOptions.length === 1) {
                setSelectedLayerId(selectOptions[0]._id);
                form.setFieldsValue({ layerId: selectOptions[0]._id });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, layer?._id, selectOptions.length]);

    /** เปลี่ยนเลเยอร์จาก Select */
    const handleLayerChange = useCallback(
        (layerId) => {
            setSelectedLayerId(layerId);
            // reset เพื่อไม่ให้หลงจากเลเยอร์เดิม (รวม geometry และ images)
            form.resetFields(['properties', 'geometry', 'images']);
            // sync layerId ในฟอร์ม
            form.setFieldsValue({ layerId });
        },
        [form]
    );

    /** ป้องกันไม่มีข้อมูลเลเยอร์ */
    if (!isEditMode && selectOptions.length === 0) {
        return <p>Error: No layers available. Please provide layers for creation mode.</p>;
    }
    if (!activeLayer) {
        return (
            <Form form={form} layout="vertical">
                {!isEditMode && (
                    <Form.Item
                        name="layerId"
                        label="Layer"
                        rules={[{ required: true, message: 'Please select a layer!' }]}
                    >
                        <Select
                            placeholder="Select a layer to begin"
                            onChange={handleLayerChange}
                            options={selectOptions}
                            fieldNames={{ label: 'name', value: '_id' }} // ✅ แสดงชื่อเลเยอร์
                            allowClear
                        />
                    </Form.Item>
                )}
                {!isEditMode && <p>Please select a layer to proceed.</p>}
                {isEditMode && <p>Error: Layer information is missing.</p>}
            </Form>
        );
    }

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            {/* เลือกเลเยอร์: ล็อกในโหมดแก้ไข, เปิดเลือกในโหมดสร้าง */}
            <Form.Item name="layerId" label="Layer" rules={[{ required: true }]}>
                <Select
                    placeholder="Select a layer"
                    onChange={handleLayerChange}
                    options={selectOptions}
                    fieldNames={{ label: 'name', value: '_id' }} // ✅ แสดงชื่อเลเยอร์
                    disabled={isEditMode}
                    allowClear={!isEditMode}
                // ค่า value ให้ Form ควบคุมเอง (ผ่าน name="layerId")
                />
            </Form.Item>

            {/* พิกัด/รูปทรง: ส่ง geometryType จากเลเยอร์ที่ใช้งานจริง */}
            <Form.Item
                name="geometry"
                label="Location"
                rules={[{ required: true, message: 'Please select a location on the map.' }]}
            >
                <GeoJSONLocationPicker geometryType={activeLayer?.geometryType} isEditMode={isEditMode} />
            </Form.Item>

            {/* อัปโหลดรูป */}
            <Form.Item
                name="images"
                label="Images"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList || [])}
            >
                <Upload
                    listType="picture-card"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    beforeUpload={(file) => {
                        const { ok, message: msg } = validateImageBeforeUpload({ file, maxMB: 10 });
                        if (!ok) message.error(msg);
                        return false; // block auto-upload; keep in fileList
                    }}
                    onPreview={(file) => {
                        const src = file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : '');
                        if (src) window.open(src, '_blank', 'noopener,noreferrer');
                    }}>
                    <Button icon={<UploadOutlined />}></Button>
                </Upload>
            </Form.Item>

            {/* ฟิลด์ตามเลเยอร์ */}
            {(activeLayer?.fields || []).map((field) => renderField(field))}

            <Form.Item>
                <Button type="primary" htmlType="submit">
                    บันทึก
                </Button>
                <Button style={{ marginLeft: 8 }} onClick={onCancel}>
                    ยกเลิก
                </Button>
            </Form.Item>
        </Form>
    );
};

export default GeoObjectForm;
