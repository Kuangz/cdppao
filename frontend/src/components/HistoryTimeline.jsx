import React from 'react';
import { Timeline, Typography, Tag } from 'antd';
import { EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const getActionIcon = (action) => {
    switch (action) {
        case 'created':
            return <PlusOutlined />;
        case 'updated':
            return <EditOutlined />;
        case 'deleted':
            return <DeleteOutlined />;
        default:
            return null;
    }
};

const getActionColor = (action) => {
    switch (action) {
        case 'created':
            return 'green';
        case 'updated':
            return 'blue';
        case 'deleted':
            return 'red';
        default:
            return 'grey';
    }
};


const HistoryTimeline = ({ history }) => {
    if (!history || history.length === 0) {
        return <Text>No history available.</Text>;
    }

    return (
        <Timeline>
            {history.slice().reverse().map((entry, index) => (
                <Timeline.Item

                    key={index}
                    dot={getActionIcon(entry.action)}
                    color={getActionColor(entry.action)}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color={getActionColor(entry.action)}>{entry.action.toUpperCase()}</Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(entry.changedAt).toLocaleString()}
                        </Text>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                        <Text> ทำรายการ โดย</Text>
                        <Text strong> [{entry.userId?.username || 'System'}] </Text>
                    </div>
                    {/* We can add more details from the 'diff' object later if needed */}
                </Timeline.Item>
            ))}
        </Timeline>
    );
};

export default HistoryTimeline;