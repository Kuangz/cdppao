import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Modal, Typography, Card, Space, Input } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useMessageApi } from "../contexts/MessageContext";
import { useAuth } from "../contexts/AuthContext";
import StatusBadge from "../components/StatusBadge";

import { BIN_STATUS_MAP } from "../utils/statusUtil";

import {
    fetchBinPoints,
    deleteBinPoint,
} from "../api/garbageBin";
import BinPointDetail from "./BinPointDetail";
import { formatDateTime } from "../utils/formatDate";
const { Title } = Typography;
const STATUS_FILTER_COL_INDEX = 3; // หรือ index ตรงกับ columns ที่ใส่ filters
const BinPointList = () => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [statusFiltered, setStatusFiltered] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const [detailPoint, setDetailPoint] = useState(null);
    const messageApi = useMessageApi();
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const FILTERABLE_STATUSES = ["active", "lost", "broken", "removed"];
    const statusOptionsAll = FILTERABLE_STATUSES.map(key => ({
        text: BIN_STATUS_MAP[key],
        value: key
    }));


    // โหลดจุดทั้งหมด
    const loadPoints = useCallback(async (page = 1, pageSize = 10, search = "", status) => {

        setLoading(true);
        try {
            const res = await fetchBinPoints({
                page,
                pageSize,
                search,
                status
            });
            setPoints(res.data);
            setPagination({
                current: res.page,
                pageSize: res.pageSize,
                total: res.total
            });
        } catch {
            messageApi.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        loadPoints();
    }, [loadPoints]);

    const handleSearch = value => {
        setSearchText(value);
        loadPoints(1, pagination.pageSize, value, statusFiltered); // reset หน้าไปหน้าแรก
    };

    const handleDelete = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        await deleteBinPoint(deleteId);
        messageApi.success("ลบจุดติดตั้งแล้ว");
        setDeleteId(null);
        loadPoints(pagination.current, pagination.pageSize, searchText, statusFiltered);
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
            title: "สถานะถัง",
            filters: statusOptionsAll,
            filteredValue: null, // ให้ controlled filter
            render: (r) =>
                r.currentBin && r.currentBin.status
                    ? <StatusBadge status={r.currentBin?.status} />
                    : "-",
        },
        {
            title: "วันที่เพิ่ม",
            render: (r) =>
                r.currentBin
                    ? <>{formatDateTime(r.createdAt)}</>
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
                    {user?.role === "admin" && (
                        <Button size="small" danger onClick={() => handleDelete(r._id)} style={{ marginLeft: 8 }}>
                            ลบ
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Card style={{ margin: "auto", marginTop: 8 }}>
            <Title level={2}>จุดติดตั้งถังขยะ</Title>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>

                <Button type="primary" onClick={() => navigate("/garbage-bins/new")}>
                    + เพิ่มจุดติดตั้ง
                </Button>

                <Input.Search
                    allowClear
                    placeholder="ค้นหา"
                    style={{ maxWidth: 340, flex: 1 }}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    onSearch={handleSearch}
                    enterButton
                />
            </div>

            <Table
                columns={columns.map(col =>
                    col.title === "สถานะถัง"
                        ? { ...col, filteredValue: statusFiltered }
                        : col
                )}
                dataSource={points}
                rowKey="_id"
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: [5, 10, 20, 50],
                }}
                onChange={(pag, filters) => {
                    const statusValues = filters[STATUS_FILTER_COL_INDEX] || [];
                    setStatusFiltered(statusValues);

                    loadPoints(
                        pag.current,
                        pag.pageSize,
                        searchText,
                        statusValues || ""
                    );
                }}
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
                <BinPointDetail
                    point={detailPoint}
                    onRefresh={async () => {
                        await loadPoints(pagination.current, pagination.pageSize, searchText, statusFiltered);
                        // ค้นหา point ที่อัพเดตล่าสุดจาก list ใหม่
                        if (detailPoint?._id) {
                            const updated = (await fetchBinPoints()).data.find(p => p._id === detailPoint._id);
                            setDetailPoint(updated || null);
                        }
                    }}
                    onClose={() => setDetailPoint(null)}
                />
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
