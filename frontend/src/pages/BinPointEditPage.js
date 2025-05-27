import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BinPointForm from "../pages/BinPointForm";
import { fetchBinPoint } from "../api/garbageBin";
import { Spin, Typography } from "antd";
import { useMessageApi } from "../contexts/MessageContext";

const BinPointEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [point, setPoint] = useState(null);
    const [loading, setLoading] = useState(true);
    const { Title } = Typography;
    const messageApi = useMessageApi();
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchBinPoint(id);
                setPoint(res.data);
            } catch {
                messageApi.error("ไม่พบข้อมูลจุดติดตั้ง");
                navigate("/garbage-bins");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate, messageApi]);

    const handleSuccess = () => {
        messageApi.success("แก้ไขจุดติดตั้งสำเร็จ");
        navigate("/garbage-bins");
    };

    if (loading) return <Spin />;

    return (
        <div style={{ maxWidth: 600, margin: "auto", padding: 12 }}>
            <Title level={2}>แก้ไขจุดติดตั้ง</Title>
            {point && <BinPointForm point={point} onSuccess={handleSuccess} />}
        </div>
    );
};

export default BinPointEditPage;
