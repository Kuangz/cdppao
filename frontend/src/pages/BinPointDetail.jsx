import React, { useState } from "react";
import { Descriptions, Image, Button, Table, Modal } from "antd";
import StatusBadge from "../components/StatusBadge";
import { useMessageApi } from "../contexts/MessageContext";
import ChangeBinStatusForm from "../components/ChangeBinStatusForm";
import useChangeBinStatus from "../hooks/useChangeBinStatus"; // <<--- custom hook

const BIN_TYPE_LABEL = {
    1: "ถังสีฟ้าทั่วไป",
    2: "จุดคัดแยกขยะ",
    3: "ถังขยะคอนเทนเนอร์"
};

const BinPointDetail = ({ point, onRefresh, onClose }) => {
    const [showHistoryForm, setShowHistoryForm] = useState(false);
    const messageApi = useMessageApi();
    const [previewImages, setPreviewImages] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    // Custom Hook
    const [handleChangeStatus, loading] = useChangeBinStatus();

    if (!point) return null;

    // ดึง lat/lng จาก array
    const coordinates = point.coordinates?.coordinates || [];
    const lat = coordinates[1];
    const lng = coordinates[0];

    // columns table
    const columns = [
        { title: "รหัสถัง", dataIndex: ["bin", "serial"] },
        {
            title: "ขนาด",
            dataIndex: ["bin", "size"],
            render: (val) => BIN_TYPE_LABEL[val] || val
        },
        { title: "สถานะ", dataIndex: ["bin", "status"], render: (v) => (<StatusBadge status={v} />) },
        { title: "วันที่เปลี่ยน", dataIndex: "changeDate", render: (v) => v && new Date(v).toLocaleString() },
        { title: "หมายเหตุ", dataIndex: "note" },
        {
            title: "รูปถัง",
            dataIndex: ["bin", "imageUrls"],
            render: (imgs, r) =>
                Array.isArray(imgs) && imgs.length > 0 ? (
                    <Button
                        size="small"
                        onClick={e => {
                            e.stopPropagation();
                            setPreviewImages(imgs);
                            setPreviewOpen(true);
                        }}
                    >
                        ดูรูป
                    </Button>
                ) : null
        }
    ];

    // ฟังก์ชันรับค่าจาก ChangeBinStatusForm
    const onSubmitStatus = async (values) => {
        await handleChangeStatus({
            pointId: point._id,
            values,
            currentBin: point.currentBin,
            messageApi,
            onRefresh,
            onDone: () => setShowHistoryForm(false),
        });
    };

    return (
        <div>
            <Descriptions title="รายละเอียดจุดติดตั้ง" bordered column={1}>
                <Descriptions.Item label="ชื่อ">{point.locationName}</Descriptions.Item>
                <Descriptions.Item label="รายละเอียด">{point.description}</Descriptions.Item>
                <Descriptions.Item label="พิกัด">
                    {lat && lng ? `Lat: ${lat}, Lng: ${lng}` : "-"}
                </Descriptions.Item>
                {point.currentBin &&
                    <Descriptions.Item label="รูปภาพ">

                        <Image.PreviewGroup>
                            {point.currentBin?.imageUrls?.map((img, idx) => (
                                <Image
                                    key={img._id || img.id || img.filename || img.name || idx}
                                    width={80}
                                    src={img}
                                    style={{ marginRight: 6, marginBottom: 6, objectFit: "cover" }}
                                    alt={`ถัง-${idx + 1}`}
                                    placeholder
                                />
                            ))}
                        </Image.PreviewGroup>
                    </Descriptions.Item>
                }
                <Descriptions.Item label="ถังปัจจุบัน">
                    {point.currentBin ? (
                        <>
                            <b>{point.currentBin.serial}</b>
                            {" ("}{BIN_TYPE_LABEL[point.currentBin.size] || point.currentBin.size}{")"}
                            {" | สถานะ: "} <StatusBadge status={point.currentBin.status} />
                        </>
                    ) : "ไม่มีถังขยะถูกติดตั้ง"}
                </Descriptions.Item>
            </Descriptions>
            <h3 style={{ marginTop: 24 }}>ประวัติการเปลี่ยนถัง</h3>
            <Button type="primary" onClick={() => setShowHistoryForm(true)} style={{ marginBottom: 12 }}>
                + เพิ่ม/เปลี่ยนสถานะถัง
            </Button>
            <Table
                dataSource={point.history}
                columns={columns}
                rowKey={r => r._id || `${r.bin?.serial || ''}-${r.changeDate || ''}`}
                style={{ marginTop: 8 }}
                pagination={false}
                size="small"
            />
            <Modal
                open={showHistoryForm}
                onCancel={() => setShowHistoryForm(false)}
                footer={null}
                destroyOnHidden={true}
                title="เปลี่ยนสถานะ/เพิ่มประวัติถัง"
            >
                <ChangeBinStatusForm
                    loading={loading}
                    initialSerial={point.currentBin?.serial}
                    initialSize={point.currentBin?.size}
                    currentStatus={point.currentBin?.status}
                    onSubmit={onSubmitStatus}
                    onCancel={() => setShowHistoryForm(false)}
                />
            </Modal>

            <Modal
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                footer={null}
                width={480}
                title="รูปถังขยะ"
            >
                <Image.PreviewGroup>
                    {previewImages.map((img, idx) => (
                        <Image
                            key={img + idx}
                            src={img}
                            width={320}
                            style={{ marginBottom: 8, borderRadius: 10 }}
                            alt={`รูปถัง-${idx + 1}`}
                        />
                    ))}
                </Image.PreviewGroup>
            </Modal>

            <div style={{ marginTop: 16 }}>
                <Button block onClick={onClose}>ปิดหน้าต่าง</Button>
            </div>
        </div>
    );
};

export default BinPointDetail;
