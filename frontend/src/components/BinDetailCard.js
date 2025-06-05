import React, { useState, useEffect } from "react";
import { Button, Descriptions, Image, Modal, Typography, Spin } from "antd";
import StatusBadge from "./StatusBadge";
import ChangeBinStatusForm from "./ChangeBinStatusForm";
import {
    EditOutlined,
    ArrowLeftOutlined,
    BarcodeOutlined,
    DatabaseOutlined,
    PictureOutlined,
    RetweetOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useChangeBinStatus from "../hooks/useChangeBinStatus";
import { fetchBinPoint } from "../api/garbageBin";
import { useAuth } from "../contexts/AuthContext";

const { Title } = Typography;

const BIN_TYPE_LABEL = {
    1: "ถังสีฟ้าทั่วไป",
    2: "จุดคัดแยกขยะ",
    3: "ถังขยะคอนเทนเนอร์"
};

const BinDetailCard = ({
    pointId,
    onBack,
    onStatusChanged,
}) => {
    const navigate = useNavigate();
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [point, setPoint] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [handleChangeStatus, loadingStatus] = useChangeBinStatus();

    // โหลดข้อมูลทุกครั้งที่ id เปลี่ยน
    useEffect(() => {
        if (!pointId) return;
        setLoading(true);
        fetchBinPoint(pointId)
            .then(res => setPoint(res.data))
            .finally(() => setLoading(false));
    }, [pointId]);


    if (loading) return <Spin style={{ width: "100%", margin: "24px 0" }}>กำลังโหลด...</Spin>;
    if (!point) return <div style={{ padding: 24 }}>ไม่พบข้อมูล</div>;

    const images = Array.isArray(point.currentBin?.imageUrls) && point.currentBin?.imageUrls.length > 0
        ? point.currentBin?.imageUrls
        : [];


    // รับค่าจาก ChangeBinStatusForm
    const onSubmitStatus = async (values) => {
        await handleChangeStatus({
            pointId,
            values,
            currentBin: point.currentBin,
            onPointUpdated: (newPoint) => setPoint(newPoint),
            onRefresh: onStatusChanged,
            onDone: () => setStatusModalOpen(false),
        });
    };

    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 10px #0001",
                padding: 24,
                maxWidth: 430,
                margin: "auto",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                }}
            >
                <Title level={4} style={{ margin: 0, color: "#0d47a1", fontWeight: 600 }}>
                    {point.locationName || "รายละเอียดจุดติดตั้ง"}
                </Title>
                <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/garbage-bins/${point._id}/edit`)}
                    size="middle"
                    aria-label="แก้ไขจุดติดตั้ง"
                >
                    แก้ไข
                </Button>
            </div>

            {/* รูปภาพ */}
            <div style={{ textAlign: "center", marginTop: 12, marginBottom: 12 }}>
                {images.length > 0 ? (
                    <Image.PreviewGroup>
                        {images.map((img, idx) => (
                            <Image
                                key={idx}
                                src={img}
                                alt={`Bin image ${idx + 1}`}
                                width={110}
                                height={80}
                                style={{
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    margin: 4,
                                    boxShadow: "0 1px 5px #0002",
                                }}
                                placeholder
                            />
                        ))}
                    </Image.PreviewGroup>
                ) : (
                    <div
                        style={{
                            width: 210,
                            height: 110,
                            background: "#f5f5f5",
                            color: "#aaa",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "auto",
                            fontSize: 16,
                            flexDirection: "column",
                        }}
                    >
                        <PictureOutlined style={{ fontSize: 38, marginBottom: 5 }} />
                        ไม่มีรูป
                    </div>
                )}
            </div>
            {point.currentBin &&
                <Descriptions
                    bordered
                    size="small"
                    column={1}
                    style={{
                        background: "#fcfcfc",
                        borderRadius: 12,
                        margin: "10px 0 8px 0",
                        padding: 8,
                        boxShadow: "0 1px 6px #0001",
                    }}
                >
                    <Descriptions.Item label={<span><BarcodeOutlined /> รหัสถัง</span>} span={1}>
                        {point.currentBin?.serial || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span><DatabaseOutlined /> ขนาด</span>} span={1}>
                        {BIN_TYPE_LABEL[point.currentBin?.size] || point.currentBin?.size || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานะ" span={1}>
                        <StatusBadge status={point.currentBin?.status} />
                    </Descriptions.Item>
                </Descriptions>
            }

            <Button
                icon={<RetweetOutlined />}
                type="dashed"
                size="large"
                onClick={() => setStatusModalOpen(true)}
                block
                style={{ marginTop: 16, borderRadius: 8, fontWeight: 500 }}
            >
                เปลี่ยนสถานะถังขยะ
            </Button>

            <Modal
                open={statusModalOpen}
                onCancel={() => setStatusModalOpen(false)}
                destroyOnHidden={true}
                title="เปลี่ยนสถานะถังขยะ"
                footer={null}
            >
                <ChangeBinStatusForm
                    loading={loadingStatus}
                    userRole={user.role}
                    initialSerial={point.currentBin?.serial}
                    initialSize={point.currentBin?.size}
                    currentStatus={point.currentBin?.status}
                    onSubmit={onSubmitStatus}
                    onCancel={() => setStatusModalOpen(false)}
                />
            </Modal>

            <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                block
                size="large"
                style={{ marginTop: 12, borderRadius: 8 }}
                aria-label="กลับไปหน้ารวมจุด"
            >
                กลับไปหน้ารวมจุด
            </Button>
        </div>
    );
};

export default BinDetailCard;
