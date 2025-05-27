import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Modal, Typography, Card, Space } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useMessageApi } from "../contexts/MessageContext";
import { useAuth } from "../contexts/AuthContext"; // <-- เพิ่มตรงนี้
import {
    fetchBinPoints,
    deleteBinPoint,
} from "../api/garbageBin";
import BinPointDetail from "./BinPointDetail";
const { Title } = Typography;

const BinPointList = () => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailPoint, setDetailPoint] = useState(null);
    const messageApi = useMessageApi();
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth(); // <-- ดึง user จาก context

    const loadPoints = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchBinPoints();
            setPoints(res.data);
        } catch {
            messageApi.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        loadPoints();
    }, [loadPoints]);

    const handleDelete = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        await deleteBinPoint(deleteId);
        messageApi.success("ลบจุดติดตั้งแล้ว");
        setDeleteId(null);
        loadPoints();
    };

    const columns = [
        { title: "ชื่อจุดติดตั้ง", dataIndex: "locationName" },
        {
            title: "พิกัด",
            render: (r) => (
                <span>
                    Lat: {r.coordinates?.coordinates?.[1]}, Lng: {r.coordinates?.coordinates?.[0]}
                </span>
            ),
        },
        {
            title: "ถังปัจจุบัน",
            render: (r) =>
                r.currentBin
                    ? `${r.currentBin.serial} (${r.currentBin.size})`
                    : "-",
        },
        {
            title: "",
            render: (r) => (
                <Space>
                    <Button size="small" onClick={() => setDetailPoint(r)}>ดูรายละเอียด</Button>
                    <Button size="small" onClick={() => navigate(`/garbage-bins/${r._id}/edit`)}>
                        แก้ไข
                    </Button>
                    {/* แสดงปุ่มลบเฉพาะ admin */}
                    {user?.role === "admin" && (
                        <Button danger onClick={() => handleDelete(r._id)} style={{ marginLeft: 8 }}>
                            ลบ
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Card style={{ margin: "auto", marginTop: 36 }}>
            <Title level={2}>จุดติดตั้งถังขยะ</Title>
            <Button type="primary" onClick={() => navigate("/garbage-bins/new")}>
                + เพิ่มจุดติดตั้ง
            </Button>
            <Table
                columns={columns}
                dataSource={points}
                rowKey="_id"
                loading={loading}
                style={{ marginTop: 24 }}
            />
            {/* Modal สำหรับดูรายละเอียด */}
            <Modal
                open={!!detailPoint}
                onCancel={() => setDetailPoint(null)}
                footer={null}
                destroyOnHidden={true}
                width={800}
            >
                <BinPointDetail point={detailPoint} onRefresh={loadPoints} />
            </Modal>
            {/* Modal ยืนยันลบ */}
            <Modal
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onOk={confirmDelete}
                okText="ลบ"
                okButtonProps={{ danger: true }}
                cancelText="ยกเลิก"
                title="ยืนยันการลบ"
                icon={<ExclamationCircleOutlined />}
                centered
            >
                คุณแน่ใจหรือไม่ว่าต้องการลบจุดติดตั้งนี้?
            </Modal>
        </Card>
    );
};
export default BinPointList;
