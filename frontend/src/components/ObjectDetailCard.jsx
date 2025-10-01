import React from 'react';
import { Card, Descriptions, Tag, Divider } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import HistoryTimeline from './HistoryTimeline';

const ObjectDetailCard = ({ object, layer }) => {
    const { user } = useAuth(); // Get user from AuthContext
    const isAdmin = user?.role === 'admin';

    if (!object) {
        return <p>Click on an object on the map to see its details.</p>;
    }

    const { properties } = object;
    const { displaySettings, fields } = layer;

    // Find the primary name/label for the title
    const titleField = fields.find(f => f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('label'));
    const title = titleField ? properties[titleField.name] : 'Selected Object';

    // Determine which fields to display
    const importantFields = displaySettings?.importantFields || [];

    // Create a lookup for field labels
    const fieldLabels = fields.reduce((acc, field) => {
        acc[field.name] = field.label;
        return acc;
    }, {});

    const renderProperty = (value) => {
        if (typeof value === 'boolean') {
            return <Tag color={value ? 'green' : 'red'}>{value.toString()}</Tag>;
        }
        if (value === null || value === undefined || value === '') {
            return <em>-</em>;
        }
        return value.toString();
    };

    return (
        <div>
            <h5 style={{ margin: 0 }}>{title}</h5>
            <hr style={{ margin: '12px 0' }} />
            <Descriptions bordered size="small" column={1}>
                {importantFields.length > 0
                    ? importantFields.map(fieldName => (
                        <Descriptions.Item label={fieldLabels[fieldName] || fieldName} key={fieldName}>
                            {renderProperty(properties[fieldName])}
                        </Descriptions.Item>
                    ))
                    : Object.entries(properties).map(([key, value]) => (
                        <Descriptions.Item label={fieldLabels[key] || key} key={key}>
                            {renderProperty(value)}
                        </Descriptions.Item>
                    ))
                }
            </Descriptions>

            {/* Admin-only History Section */}
            {isAdmin && object.history && object.history.length > 0 && (
                <>
                    <Divider >ประวัติการแก้ไข</Divider>
                    <HistoryTimeline history={object.history} />
                </>
            )}
        </div>
    );
};

export default ObjectDetailCard;