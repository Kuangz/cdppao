import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, Row, Col, message, Spin } from 'antd';
import { createRole, updateRole } from '../api/role';
import { getLayers } from '../api/layer';

const PERMISSIONS = ['read', 'create', 'update', 'delete'];

const RoleForm = ({ role, onClose }) => {
    const [form] = Form.useForm();
    const [layers, setLayers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchLayers = async () => {
            try {
                const layersRes = await getLayers();
                setLayers(layersRes.data);
            } catch (error) {
                message.error('Failed to fetch layers for permissions.');
            }
        };

        fetchLayers();
    }, []);

    useEffect(() => {
        if (role) {
            const permissions = {};
            console.log(JSON.stringify(role.permissions))
            role.permissions.forEach(p => {
                permissions[p.layer] = p.actions;
            });
            form.setFieldsValue({ name: role.name, permissions });
        } else {
            form.resetFields();
        }
    }, [role, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        const permissions = Object.keys(values.permissions || {})
            .map(layerId => ({
                layer: layerId,
                actions: values.permissions[layerId] || [],
            }))
            .filter(p => p.actions.length > 0);

        const roleData = { name: values.name, permissions };

        try {
            if (role) {
                await updateRole(role._id, roleData);
                message.success('Role updated successfully.');
            } else {
                await createRole(roleData);
                message.success('Role created successfully.');
            }
            onClose();
        } catch (error) {
            message.error('Failed to save role.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="name"
                    label="Role Name"
                    rules={[{ required: true, message: 'Please enter the role name' }]}
                >
                    <Input />
                </Form.Item>

                <h3>Permissions</h3>
                {layers?.map(layer => (
                    <div key={layer._id}>
                        <h4>{layer.name}</h4>
                        <Form.Item name={['permissions', layer._id]}>
                             <Checkbox.Group>
                                <Row>
                                    {PERMISSIONS?.map(permission => (
                                        <Col span={6} key={permission}>
                                            <Checkbox value={permission}>{permission}</Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>
                    </div>
                ))}

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        {role ? 'Update Role' : 'Create Role'}
                    </Button>
                </Form.Item>
            </Form>
        </Spin>
    );
};

export default RoleForm;
