import React from 'react';
import { Card, Checkbox, List, Typography, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth to check permissions

const { Text } = Typography;

const LayerControl = ({ layers, visibleLayerIds, onVisibilityChange, onCreateObject }) => {
    const { user } = useAuth(); // Get user from AuthContext

    const handleCheckboxChange = (layerId, checked) => {
        const newVisibleLayerIds = new Set(visibleLayerIds);
        if (checked) {
            newVisibleLayerIds.add(layerId);
        } else {
            newVisibleLayerIds.delete(layerId);
        }
        onVisibilityChange(Array.from(newVisibleLayerIds));
    };

    const canCreate = (layerId) => {
        if (!user || !user.role) return false;
        if (user.role.name === 'admin') return true;
        const permission = user.role.permissions?.find(p => p.layer._id === layerId);
        return permission && permission.actions.includes('create');
    };

    return (
        <Card title="Layers" size="small">
            <List
                dataSource={layers}
                renderItem={layer => (
                    <List.Item
                        key={layer._id}
                        actions={[
                            canCreate(layer._id) && (
                                <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() => onCreateObject(layer._id)}
                                />
                            )
                        ]}
                    >
                        <Checkbox
                            checked={visibleLayerIds.includes(layer._id)}
                            onChange={(e) => handleCheckboxChange(layer._id, e.target.checked)}
                        >
                            <Text>{layer.name}</Text>
                        </Checkbox>
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default LayerControl;
