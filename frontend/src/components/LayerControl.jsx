import React from 'react';
import { Card, Checkbox, List, Typography } from 'antd';

const { Text } = Typography;

const LayerControl = ({ layers, visibleLayerIds, onVisibilityChange }) => {
    const handleCheckboxChange = (layerId, checked) => {
        const newVisibleLayerIds = new Set(visibleLayerIds);
        if (checked) {
            newVisibleLayerIds.add(layerId);
        } else {
            newVisibleLayerIds.delete(layerId);
        }
        onVisibilityChange(Array.from(newVisibleLayerIds));
    };

    return (
        <Card title="Layers" size="small">
            <List
                dataSource={layers}
                renderItem={layer => (
                    <List.Item key={layer._id}>
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
