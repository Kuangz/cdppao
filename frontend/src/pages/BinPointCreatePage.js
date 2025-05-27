import React from "react";
import { useNavigate } from "react-router-dom";
import BinPointForm from "../pages/BinPointForm";
import { Typography } from "antd";
import { useMessageApi } from "../contexts/MessageContext";
const BinPointCreatePage = () => {
    const navigate = useNavigate();
    const { Title } = Typography;
    const messageApi = useMessageApi();

    const handleSuccess = () => {
        messageApi.success("เพิ่มจุดติดตั้งสำเร็จ");
        navigate("/garbage-bins"); // กลับหน้ารวม
    };

    return (
        <div style={{ maxWidth: 600, margin: "auto", padding: 12 }}>
            <Title level={2}>เพิ่มจุดติดตั้งใหม่</Title>
            <BinPointForm onSuccess={handleSuccess} />
        </div>
    );
};

export default BinPointCreatePage;
