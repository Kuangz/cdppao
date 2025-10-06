import React from 'react';
import { Collapse, Badge } from 'antd';
import HistoryTimeline from './HistoryTimeline';

const CollapsibleHistory = ({ title = 'ประวัติ', history = [], defaultOpen = false }) => {
    const items = [
        {
            key: 'hist',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{title}</span>
                    <Badge count={history.length} overflowCount={999} />
                </div>
            ),
            children: <HistoryTimeline history={history} />, // ด้านในเป็นไทม์ไลน์ (พับรายแถวได้อีกชั้น)
        },
    ];

    return (
        <Collapse
            items={items}
            defaultActiveKey={defaultOpen ? ['hist'] : []}
            bordered={false}
        />
    );
};

export default CollapsibleHistory;
