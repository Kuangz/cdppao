import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Statistic, Button, Spin } from "antd";
import {
    EnvironmentOutlined,
    DeleteOutlined,
    AimOutlined,
} from "@ant-design/icons";
import { fetchBinPointsForMap, fetchBinPointNearBy } from "../api/garbageBin";
import useCurrentLocation from "../hooks/useCurrentLocation";
import NearbyBinTable from "../components/NearbyBinTable";
import BinDetailCard from "../components/BinDetailCard";
import { MapWithBinsAndShape } from "../components/Map";
import useResponsiveMapHeight from "../hooks/useResponsiveMapHeight";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const [points, setPoints] = useState([]);
    const [nearbyPoints, setNearbyPoints] = useState([]);
    const [selectedPointId, setSelectedPointId] = useState(null); // use id
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [loadingNearby, setLoadingNearby] = useState(false);

    const {
        location,
        locating,
        error: locationError,
        getCurrentLocation,
    } = useCurrentLocation(true);

    const mapHeight = useResponsiveMapHeight(600, 320);
    const navigate = useNavigate();

    // โหลดจุดทั้งหมด
    const loadPoints = useCallback(async () => {
        setLoadingPoints(true);
        try {
            const { data } = await fetchBinPointsForMap();
            setPoints(data || []);
        } catch (err) {
            console.error("Failed to fetch bin points:", err);
        } finally {
            setLoadingPoints(false);
        }
    }, []);

    useEffect(() => {
        loadPoints();
    }, [loadPoints]);

    // โหลดจุดใกล้เคียง
    const loadNearby = useCallback(async () => {
        if (!location?.lat || !location?.lng) return;
        setLoadingNearby(true);
        try {
            const { data } = await fetchBinPointNearBy(location.lat, location.lng, 300);
            setNearbyPoints(data || []);
        } catch (err) {
            console.error("Failed to fetch nearby bin points:", err);
        } finally {
            setLoadingNearby(false);
        }
    }, [location]);

    useEffect(() => {
        if (location) loadNearby();
    }, [location, loadNearby]);

    const totalBins = points.filter(p => p.currentBin !== undefined).length;;
    const brokenBins = points.reduce(
        (count, pt) =>
            pt.currentBin?.status?.toLowerCase() === "broken" ? count + 1 : count,
        0
    );
    const lostBins = points.reduce(
        (count, pt) =>
            pt.currentBin?.status?.toLowerCase() === "lost" ? count + 1 : count,
        0
    );

    const handleSelectPoint = useCallback((pt) => {
        setSelectedPointId(pt._id); // ใช้ id
        setTimeout(() => {
            document.getElementById("manage-section")?.scrollIntoView({ behavior: "smooth" });
        }, 200);
    }, []);

    const handleClearSelection = useCallback(() => setSelectedPointId(null), []);
    const handleAddPoint = useCallback(() => navigate("/garbage-bins/new"), [navigate]);

    const centerStyle = { textAlign: "center", padding: 64 };

    const handleStatusChanged = useCallback(() => {
        loadPoints();
        loadNearby();
    }, [loadPoints, loadNearby]);

    return (
        <div style={{ maxWidth: 1200, margin: "auto", padding: "16px 4px" }}>
            {locating || loadingPoints ? (
                <div style={centerStyle}>
                    <Spin style={{ width: "100%", marginTop: 64 }}>
                        {locating
                            ? "กำลังค้นหาตำแหน่ง..."
                            : "กำลังโหลดจุดถังขยะทั้งหมด..."}
                    </Spin>
                </div>
            ) : (
                <>
                    {locationError && (
                        <div style={{ color: "red", marginBottom: 12 }}>
                            ไม่สามารถดึงตำแหน่ง: {locationError}
                        </div>
                    )}

                    <Row gutter={[16, 16]}>
                        {/* Map Section */}
                        <Col xs={24} md={14}>
                            <Card
                                hoverable
                                styles={{
                                    body: {
                                        padding: 0,
                                        background: "#f7fafc",
                                        position: "relative",
                                        height: mapHeight,
                                    },
                                }}
                            >
                                <Button
                                    type="primary"
                                    icon={<AimOutlined />}
                                    onClick={
                                        () => {
                                            getCurrentLocation()
                                            handleClearSelection()
                                        }
                                    }
                                    loading={locating}
                                    style={{
                                        position: "absolute",
                                        top: 14,
                                        right: 18,
                                        zIndex: 1000,
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.17)",
                                    }}
                                >
                                    ใช้ตำแหน่งปัจจุบัน
                                </Button>

                                <MapWithBinsAndShape
                                    binPoints={points}
                                    selectedPointId={selectedPointId}
                                    onSelectPoint={handleSelectPoint}
                                    currentLocation={location}
                                    loading={loadingPoints}
                                    mapHeight={mapHeight}
                                />
                            </Card>
                        </Col>

                        {/* Stats & Manage */}
                        <Col xs={24} md={10}>
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Card hoverable>
                                        <Statistic
                                            title="จุดติดตั้ง"
                                            value={totalBins}
                                            prefix={<EnvironmentOutlined />}
                                            valueStyle={{ color: "#1565c0" }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card hoverable>
                                        <Statistic
                                            title="ชำรุด"
                                            value={brokenBins}
                                            prefix={<DeleteOutlined />}
                                            valueStyle={{
                                                color: brokenBins ? "#e53935" : "#388e3c",
                                            }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card hoverable>
                                        <Statistic
                                            title="สูญหาย"
                                            value={lostBins}
                                            prefix={<DeleteOutlined />}
                                            valueStyle={{
                                                color: lostBins ? "#ffa726" : "#388e3c",
                                            }}
                                        />
                                    </Card>
                                </Col>

                                <Col span={24}>
                                    <Card hoverable id="manage-section" styles={{ body: { padding: 12 } }}>
                                        {loadingNearby ? (
                                            <Spin>กำลังค้นหาจุดใกล้เคียง...</Spin>
                                        ) : selectedPointId ? (
                                            <BinDetailCard
                                                pointId={selectedPointId}
                                                onBack={handleClearSelection}
                                                onStatusChanged={handleStatusChanged}
                                            />
                                        ) : (
                                            <NearbyBinTable
                                                data={nearbyPoints}
                                                onSelect={handleSelectPoint}
                                                onAdd={handleAddPoint}
                                            />
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default Dashboard;
