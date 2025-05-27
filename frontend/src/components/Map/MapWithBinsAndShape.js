import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { Spin } from "antd";
import MarkerWithZoomIcon from "./MarkerWithZoomIcon";
import ZoomAdaptiveCircle from "./ZoomAdaptiveCircle";
import SetMapCenter from "./SetMapCenter";
import GeoJsonShape from "./GeoJsonShape";
import { ZoomToDefaultButton } from "./ZoomToDefault"; // Optional: ปุ่มรีเซ็ตซูม


const MapWithBinsAndShape = ({
    binPoints = [],
    selectedPoint,
    onSelectPoint,
    currentLocation,
    loading,
    shouldCenter,
    setShouldCenter,
    mapHeight = 600 // default เผื่อลืมส่ง
}) => {
    // ป้องกัน render แผนที่ถ้าไม่มี lat/lng ที่ถูกต้อง
    if (
        !currentLocation ||
        typeof currentLocation.lat !== "number" ||
        typeof currentLocation.lng !== "number"
    ) {
        return <div style={{ minHeight: mapHeight }} />;
    }

    return (
        <div
            style={{
                width: "100%",
                height: mapHeight,
                margin: "auto",
                borderRadius: 12,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {loading ? (
                <Spin tip="กำลังโหลด..." spinning>
                    <div style={{ minHeight: 100 }} />
                </Spin>
            ) : (
                <MapContainer
                    center={[currentLocation.lat, currentLocation.lng]}
                    zoom={16}
                    minZoom={13}
                    maxZoom={18}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Shape ของพื้นที่ */}
                    <GeoJsonShape url="/shapefile/all.kml" />

                    {/* จุดถังขยะทั้งหมด */}
                    {binPoints.filter(pt =>
                        Array.isArray(pt.coordinates?.coordinates) &&
                        typeof pt.coordinates.coordinates[1] === "number" &&
                        typeof pt.coordinates.coordinates[0] === "number"
                    ).map((pt, idx) => (
                        <MarkerWithZoomIcon
                            key={pt._id || idx}
                            position={[
                                pt.coordinates.coordinates[1],
                                pt.coordinates.coordinates[0],
                            ]}
                            isSelected={selectedPoint && selectedPoint._id === pt._id}
                            onClick={() => onSelectPoint && onSelectPoint(pt)}
                            popupContent={
                                <>
                                    <b>{pt.locationName}</b>
                                    <br />
                                    Serial: {pt.currentBin?.serial}
                                    <br />
                                    Status: {pt.currentBin.status}
                                </>
                            }
                        />
                    ))}

                    {/* ตำแหน่งผู้ใช้ */}
                    {currentLocation && (
                        <>
                            <SetMapCenter
                                position={currentLocation}
                                trigger={shouldCenter}
                                onCentered={() => setShouldCenter(false)}
                            />
                            <ZoomAdaptiveCircle center={[currentLocation.lat, currentLocation.lng]} />
                        </>
                    )}

                    {/* ปุ่มรีเซ็ตซูม */}
                    {typeof ZoomToDefaultButton === "function" && <ZoomToDefaultButton />}
                </MapContainer>
            )}
        </div>
    );
};

export default MapWithBinsAndShape;
