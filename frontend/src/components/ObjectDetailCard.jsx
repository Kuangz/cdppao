import React from 'react';
import { Descriptions, Tag, Divider, Image, Empty, Row, Col, Badge, Typography } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import CollapsibleHistory from './CollapsibleHistory';
import { publicUrlFromPath } from '../utils/imageHelpers'; // ✅ ใช้ helper แปลงพาธเป็น URL

const { Text } = Typography;

const ObjectDetailCard = ({ object, layer }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    if (!object) {
        return <p>Click on an object on the map to see its details.</p>;
    }

    const { properties, images = [] } = object;
    const { displaySettings, fields } = layer;

    // Find the primary name/label for the title
    const titleField = fields.find(
        f => f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('label')
    );
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

    // ปรับรูปเป็น public URL
    const imageItems = (images || []).map((p) => ({
        src: publicUrlFromPath(p),
        alt: `image-${(p || '').split('/').pop() || 'preview'}`,
    }));

    return (
        <div>
            <h5 style={{ margin: 0 }}>{title}</h5>
            <hr style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text strong>รูปภาพ</Text>
                <Badge style={{ backgroundColor: '#52c41a' }} count={imageItems.length} />
            </div>

            {imageItems.length === 0 ? (
                <Empty description="ไม่มีรูปภาพ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <Image.PreviewGroup>
                    <Row gutter={[8, 8]}>
                        {imageItems.map((img, idx) => (
                            <Col xs={8} sm={8} md={8} lg={8} xl={8} key={idx}>
                                <Image
                                    src={img.src}
                                    alt={img.alt}
                                    style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8 }}
                                // ถ้าอยาก lazy: preview={{ mask: 'ดู' }}
                                />
                            </Col>
                        ))}
                    </Row>
                </Image.PreviewGroup>
            )}
            <Divider style={{ margin: '16px 0' }} />

            <Descriptions bordered size="small" column={1}>
                {importantFields.length > 0
                    ? importantFields.map((fieldName) => (
                        <Descriptions.Item label={fieldLabels[fieldName] || fieldName} key={fieldName}>
                            {renderProperty(properties[fieldName])}
                        </Descriptions.Item>
                    ))
                    : Object.entries(properties).map(([key, value]) => (
                        <Descriptions.Item label={fieldLabels[key] || key} key={key}>
                            {renderProperty(value)}
                        </Descriptions.Item>
                    ))}
            </Descriptions>

            {/* Images Section */}


            <Divider style={{ margin: '16px 0' }} />
            {/* Admin-only History Section */}
            {isAdmin && object.history?.length > 0 && (
                <CollapsibleHistory
                    title="ประวัติการแก้ไข"
                    history={object.history}
                    defaultOpen={false}
                />
            )}
        </div>
    );
};

export default ObjectDetailCard;
