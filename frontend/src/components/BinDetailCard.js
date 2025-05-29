import React from "react";
import { Button, Badge, Descriptions, Image } from "antd";
import {
    EditOutlined,
    ArrowLeftOutlined,
    BarcodeOutlined,
    DatabaseOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const BIN_TYPE_LABEL = {
    1: "ถังสีฟ้าทั่วไป",
    2: "จุดคัดแยกขยะ",
    3: "ถังขยะคอนเทนเนอร์"
};

const BinDetailCard = ({ selectedPoint, onBack }) => {
    const navigate = useNavigate();

    // ดึง array ของภาพ ถ้าไม่มีให้เป็น array ว่าง
    const images =
        Array.isArray(selectedPoint.images) && selectedPoint.images.length > 0
            ? selectedPoint.images
            : [];


    return (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <b style={{ fontSize: 17 }}>
                    {selectedPoint.locationName || "รายละเอียดจุดติดตั้ง"}
                </b>
                <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/garbage-bins/${selectedPoint._id}/edit`)}
                >
                    แก้ไข
                </Button>
            </div>

            {/* ส่วนแสดงรูป (ถ้ามีหลายรูปแสดง preview group) */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
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
                            height: 140,
                            background: "#ececec",
                            color: "#999",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "auto",
                            fontSize: 15,
                        }}
                    >
                        No Image
                    </div>
                )}
            </div>

            <div style={{ marginTop: 10, marginBottom: 8, color: "#666" }}>
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
                    <Descriptions.Item label={<span><BarcodeOutlined /> Serial</span>} span={1}>
                        {selectedPoint.currentBin?.serial || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span><DatabaseOutlined /> ขนาด</span>} span={1}>
                        {BIN_TYPE_LABEL[selectedPoint.currentBin?.size] || selectedPoint.currentBin?.size || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานะ" span={1}>
                        <Badge
                            status={selectedPoint.currentBin?.status === "เสีย" ? "error" : "success"}
                            text={selectedPoint.currentBin?.status || "-"}
                            color={selectedPoint.currentBin?.status === "เสีย" ? "#e53935" : "#388e3c"}
                            style={{ fontWeight: 500 }}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label={<span><EnvironmentOutlined /> Lat/Lng</span>} span={1}>
                        {selectedPoint.coordinates?.coordinates
                            ? `${selectedPoint.coordinates.coordinates[1]}, ${selectedPoint.coordinates.coordinates[0]}`
                            : "-"}
                    </Descriptions.Item>
                </Descriptions>
            </div>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                block
                size="large"
                style={{ marginTop: 8 }}
            >
                กลับไปหน้ารวมจุด
            </Button>
        </>
    );
};

export default BinDetailCard;
