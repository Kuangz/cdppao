import React, { useState } from "react";
import { Descriptions, Image, Button, Table, Modal, Form, Input, message } from "antd";
import { addBinHistory } from "../api/garbageBin";


const BinPointDetail = ({ point, onRefresh }) => {
    const [showHistoryForm, setShowHistoryForm] = useState(false);

    if (!point) return null;

    const handleAddHistory = async (values) => {
        try {
            await addBinHistory(point._id, { ...values, updateCurrentBin: true });
            message.success("บันทึกประวัติถังแล้ว");
            setShowHistoryForm(false);
            onRefresh();
        } catch {
            message.error("เกิดข้อผิดพลาด");
        }
    };

    const columns = [
        { title: "รหัสถัง", dataIndex: ["bin", "serial"] },
        { title: "ขนาด", dataIndex: ["bin", "size"] },
        { title: "สถานะ", dataIndex: ["bin", "status"] },
        { title: "วันที่เปลี่ยน", dataIndex: "changeDate", render: (v) => v && new Date(v).toLocaleString() },
        { title: "หมายเหตุ", dataIndex: "note" },
    ];

    return (
        <div>
            <Descriptions title="รายละเอียดจุดติดตั้ง" bordered column={1}>
                <Descriptions.Item label="ชื่อ">{point.locationName}</Descriptions.Item>
                <Descriptions.Item label="รายละเอียด">{point.description}</Descriptions.Item>
                <Descriptions.Item label="พิกัด">
                    Lat: {point.coordinates?.lat}, Lng: {point.coordinates?.lng}
                </Descriptions.Item>
                <Descriptions.Item label="รูปภาพ">
                    <Image.PreviewGroup>
                        {point.images?.map((img, idx) => (
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
                <Descriptions.Item label="ถังปัจจุบัน">
                    {point.currentBin ? (
                        <>
                            <b>{point.currentBin.serial}</b> ({point.currentBin.size}) | สถานะ: {point.currentBin.status}
                        </>
                    ) : "-"}
                </Descriptions.Item>
            </Descriptions>
            <h3 style={{ marginTop: 24 }}>ประวัติการเปลี่ยนถัง</h3>
            <Button onClick={() => setShowHistoryForm(true)}>+ เพิ่มประวัติถัง</Button>
            <Table
                dataSource={point.history}
                columns={columns}
                rowKey={r => r._id || `${r.bin?.serial || ''}-${r.changeDate || ''}`}
                style={{ marginTop: 8 }}
            />


            <Modal
                open={showHistoryForm}
                onCancel={() => setShowHistoryForm(false)}
                footer={null}
                destroyOnHidden={true}
                title="เพิ่มประวัติถัง"
            >
                <Form layout="vertical" onFinish={handleAddHistory}>
                    <Form.Item label="รหัสถัง" name="serial" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="ขนาด" name="size" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="สถานะ" name="status">
                        <Input />
                    </Form.Item>
                    <Form.Item label="หมายเหตุ" name="note">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>บันทึก</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default BinPointDetail;
