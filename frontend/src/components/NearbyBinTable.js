import React from "react";
import { Table, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import StatusBadge from "./StatusBadge";

const columns = [
    {
        title: "ชื่อจุดติดตั้ง",
        dataIndex: "locationName",
        key: "locationName",
        render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
        title: "รหัสถัง",
        dataIndex: ["currentBin", "serial"],
        key: "serial",
        render: (serial) => serial || "-",
        width: 100,
        align: "center"
    },
    {
        title: "สถานะ",
        dataIndex: ["currentBin", "status"],
        key: "status",
        width: 110,
        align: "center",
        render: (status) => <StatusBadge status={status} />,
    },
];

const NearbyBinTable = ({ data, onSelect, onAdd }) => (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <b>จุดติดตั้งใกล้ตำแหน่งคุณ (300 เมตร):</b>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
            >
                เพิ่มจุดติดตั้ง
            </Button>
        </div>
        <div style={{ marginTop: 14 }}>
            <Table
                columns={columns}
                dataSource={data}
                rowKey={(r) => r._id || r.locationName}
                size="small"
                bordered
                pagination={false}
                style={{ marginTop: 8 }}
                locale={{ emptyText: "ไม่พบจุดใกล้เคียง" }}
                onRow={record => ({
                    onClick: () => onSelect(record),
                    style: { cursor: "pointer" }
                })}
            />
        </div>
    </>
);

export default NearbyBinTable;
