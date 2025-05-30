import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Card, Divider, Select } from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { createBinPoint, updateBinPoint } from "../api/garbageBin";
import { useMessageApi } from "../contexts/MessageContext";
import LocationPicker from "../components/LocationPicker";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";

const DEFAULT_POSITION = { lat: 7.8804, lng: 98.3923 };
const MAX_IMAGE_COUNT = 5;
const BIN_TYPE = [
    { value: 1, label: "ถังสีฟ้าทั่วไป" },
    { value: 2, label: "จุดคัดแยกขยะ" },
    { value: 3, label: "ถังขยะคอนเทนเนอร์" }
];
export default function BinPointForm({ point = null, onSuccess = () => { } }) {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const messageApi = useMessageApi();
    const [fileList, setFileList] = useState([]);

    const [location, setLocation] = useState(undefined); 

    useEffect(() => {
        if (point) {
            const [lng, lat] = point.coordinates?.coordinates || [];
            const pointLoc = { lat, lng };
            setLocation(pointLoc);
            const images = (point.images || []).map((url, i) => ({
                uid: `init-${i}`,
                name: url.split('/').pop(),
                status: 'done',
                url,
            }));
            setFileList(images);
            form.setFieldsValue({
                locationName: point.locationName,
                description: point.description,
                serial: point.currentBin?.serial,
                size: point.currentBin?.size,
                images,
            });
        } else {
            form.resetFields();
            setFileList([]);
            setLocation(undefined);
        }
    }, [point, form]);

    const handleFinish = async (values) => {
        try {
            const stripHost = (url) => {
                const match = url.match(/(\/uploads\/garbage_bins\/.+)$/);
                return match ? match[1] : url;
            };

            const fileList = values.images || [];
            const images = fileList.map((f) => f.originFileObj).filter(Boolean);

            const existingImages = fileList
                .filter(f => !f.originFileObj && f.url)
                .map(f => stripHost(f.url));

            const safeLocation =
                location && typeof location.lat === "number" && typeof location.lng === "number"
                    ? location
                    : DEFAULT_POSITION;

            const payload = {
                locationName: values.locationName,
                description: values.description || "",
                lat: safeLocation.lat,
                lng: safeLocation.lng,
                currentBin: {
                    serial: values.serial,
                    size: values.size,
                },
                existingImages
            };

            if (point) {
                await updateBinPoint(point._id, payload, images);
            } else {
                await createBinPoint(payload, images);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            messageApi.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    return (
        <Card
            style={{
                maxWidth: 480,
                margin: "auto",
                marginTop: 16,
                borderRadius: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                padding: 16,
            }}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>

                <Form.Item
                    label="ชื่อจุดติดตั้ง"
                    name="locationName"
                    rules={[{ required: true, message: "กรุณาระบุชื่อจุดติดตั้ง" }]}
                >
                    <Input placeholder="ชื่อจุดติดตั้ง" size="large" />
                </Form.Item>

                <Form.Item label="ตำแหน่ง (เลือกบนแผนที่)">
                    <LocationPicker value={location} onChange={setLocation} />
                </Form.Item>

                <Divider />

                <Form.Item
                    label="รูปภาพถังขยะ"
                    name="images"
                    valuePropName="fileList"
                    getValueFromEvent={() => fileList}
                >
                    <Upload
                        listType="picture-card"
                        multiple
                        accept="image/*"
                        capture="environment"
                        maxCount={MAX_IMAGE_COUNT}
                        fileList={fileList}
                        onChange={({ fileList: newFileList }) => {
                            setFileList(newFileList);
                            form.setFieldsValue({ images: newFileList }); // sync form
                        }}
                        beforeUpload={async (file) => {
                            if (!file.type.startsWith("image/")) return false;
                            const options = {
                                maxSizeMB: 0.5,
                                maxWidthOrHeight: 1024,
                                useWebWorker: true,
                            };
                            try {
                                const compressedFile = await imageCompression(file, options);
                                compressedFile.uid = file.uid;
                                return compressedFile;
                            } catch (err) {
                                return file;
                            }
                        }}
                    >
                        {fileList.length < MAX_IMAGE_COUNT && (
                            <div>
                                <PlusOutlined />
                                <div style={{ fontSize: 12 }}>เพิ่มรูป</div>
                            </div>
                        )}
                    </Upload>
                </Form.Item>

                <Form.Item
                    label="รหัสถัง"
                    name="serial"
                    rules={[{ required: true, message: "กรุณาระบุรหัสถัง" }]}
                >
                    <Input placeholder="รหัสถัง" size="large" />
                </Form.Item>
                <Form.Item
                    label="ประเภทถัง"
                    name="size"
                    rules={[{ required: true, message: "กรุณาระบุประเภทถัง" }]}
                >
                    <Select
                        placeholder="เลือกประเภทถัง"
                        size="large"
                        options={BIN_TYPE}
                    />
                </Form.Item>

                <Form.Item label="รายละเอียด" name="description">
                    <Input.TextArea rows={2} placeholder="รายละเอียด" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" block style={{ borderRadius: 12 }}>
                        {point ? "บันทึก" : "เพิ่ม"}
                    </Button>
                    <Button
                        type="default"
                        block
                        icon={<ArrowLeftOutlined />}
                        style={{ marginTop: 8, borderRadius: 12 }}
                        onClick={() => navigate(-1)}
                    >
                        ย้อนกลับ
                    </Button>
                </Form.Item>
            </Form>

        </Card >
    );
}
