import React, { useState } from 'react';
import { Form, Input, Select, Button, Space, Popover } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { SketchPicker } from 'react-color';
import IconPicker from './IconPicker';
import * as FaIcons from 'react-icons/fa';

const { Option } = Select;

const LayerForm = ({ form, onFinish, initialValues }) => {
    const watchedFields = Form.useWatch('fields', form);
    const fieldOptions = (watchedFields || [])
        .filter(field => field && field.name)
        .map(field => ({
            label: field.label || field.name,
            value: field.name
        }));
    const geometryType = Form.useWatch('geometryType', form);
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const [displayIconPicker, setDisplayIconPicker] = useState(false);
    const color = Form.useWatch('color', form);
    const icon = Form.useWatch('icon', form);

    const SelectedIcon = icon ? FaIcons[icon] : null;

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues}
            name="layer_form"
        >
            <Form.Item
                name="name"
                label="Layer Name"
                rules={[{ required: true, message: 'Please input the layer name!' }]}
            >
                <Input placeholder="e.g., Public Parks" />
            </Form.Item>

            <Form.Item
                name="geometryType"
                label="Geometry Type"
                rules={[{ required: true, message: 'Please select a geometry type!' }]}
            >
                <Select placeholder="Select a type">
                    <Option value="Point">Point</Option>
                    <Option value="Polygon">Polygon</Option>
                    <Option value="LineString">LineString</Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Important Fields for Display"
                name={['displaySettings', 'importantFields']}
                tooltip="Select fields to be highlighted in the dashboard's detail view."
            >
                <Select
                    mode="multiple"
                    placeholder="Select fields"
                    options={fieldOptions}
                />
            </Form.Item>
            {geometryType === 'Point' && (
                <Form.Item name="icon" label="Icon">
                    <Popover
                        content={
                            <IconPicker
                                onSelect={(iconName) => {
                                    form.setFieldsValue({ icon: iconName });
                                    setDisplayIconPicker(false);
                                }}
                            />
                        }
                        trigger="click"
                        visible={displayIconPicker}
                        onVisibleChange={setDisplayIconPicker}
                    >
                        <Button>
                            {SelectedIcon ? <SelectedIcon /> : 'Select Icon'}
                        </Button>
                    </Popover>
                </Form.Item>
            )}

            {(geometryType === 'Polygon' || geometryType === 'LineString') && (
                <Form.Item name="color" label="Color">
                    <Popover
                        content={
                            <SketchPicker
                                color={color}
                                onChange={(color) => form.setFieldsValue({ color: color.hex })}
                            />
                        }
                        trigger="click"
                        visible={displayColorPicker}
                        onVisibleChange={setDisplayColorPicker}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '2px',
                                background: color,
                                border: '1px solid #ccc',
                                cursor: 'pointer'
                            }} />
                            <Input
                                value={color}
                                style={{ marginLeft: 8 }}
                                onChange={(e) => form.setFieldsValue({ color: e.target.value })}
                            />
                        </div>
                    </Popover>
                </Form.Item>
            )}

            <h4>Custom Fields</h4>
            <p style={{ color: '#888', marginTop: '-10px', marginBottom: '12px' }}>Define the data schema for this layer.</p>
            <Form.List name="fields">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Space key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'baseline' }} align="start">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'name']}
                                    rules={[{ required: true, message: 'Missing field name' }, { pattern: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, and underscores are allowed.' }]}

                                >
                                    <Input placeholder="Field Name (e.g., park_name)" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'label']}
                                    rules={[{ required: true, message: 'Missing field label' }]}
                                >
                                    <Input placeholder="Field Label (e.g., Park Name)" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'type']}
                                    rules={[{ required: true, message: 'Missing field type' }]}
                                >
                                    <Select placeholder="Type" style={{ width: 120 }}>
                                        <Option value="String">String</Option>
                                        <Option value="Number">Number</Option>
                                        <Option value="Boolean">Boolean</Option>
                                        <Option value="Date">Date</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'required']}
                                    valuePropName="checked"
                                >
                                    <Select placeholder="Required?" style={{ width: 100 }}>
                                        <Option value={true}>Required</Option>
                                        <Option value={false}>Optional</Option>
                                    </Select>
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => remove(name)} />
                            </Space>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Add Field
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        </Form>
    );
};

export default LayerForm;
