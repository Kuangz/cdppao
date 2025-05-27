import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Spin } from "antd";
import L from "leaflet";
import useCurrentLocation from "../hooks/useCurrentLocation";

// ─── Leaflet default icon fix ─────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const DEFAULT_POSITION = { lat: 7.8804, lng: 98.3923 };
const isValidPos = pos =>
    pos &&
    typeof pos.lat === "number" &&
    typeof pos.lng === "number";

// ─── Reset center on prop change ────────────────────────────────────────────────
const ResetMapCenter = ({ center }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (Array.isArray(center) && center.length === 2) {
            map.setView(center);
            setTimeout(() => map.invalidateSize(), 200);
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ value, onChange, visible }) => {
    const mapRef = useRef(null);

    // สถานะภายใน: position ปัจจุบัน และ flag บอกว่าให้ override ด้วย geoLoc
    const [position, setPosition] = useState(
        isValidPos(value) ? value : null
    );
    const [overrideWithGeo, setOverrideWithGeo] = useState(false);

    const {
        location: geoLoc,
        locating: geoLoading,
        error: geoError,
        getCurrentLocation,
    } = useCurrentLocation();

    // 1) ถ้ามี prop value ใหม่ เข้ามา (parent ดึง point เดิมมา) ให้ sync
    useEffect(() => {
        if (isValidPos(value)) {
            setPosition(value);
        }
    }, [value]);

    // 2) ตอน mount ถ้าไม่มี value ก็ให้ดึง GPS
    useEffect(() => {
        if (!isValidPos(value)) {
            getCurrentLocation();
        }
    }, [value, getCurrentLocation]);

    // 3) เมื่อ hook geoLoc คืนค่าใหม่มา
    //    – ถ้าเป็นครั้งแรก (value ยังไม่มี) ก็เหมือนเดิม  
    //    – หรือถ้า overrideWithGeo = true (ผู้ใช้กดปุ่ม) ก็ให้ override
    useEffect(() => {
        if (isValidPos(geoLoc)) {
            const newPos = { lat: geoLoc.lat, lng: geoLoc.lng };

            if (!isValidPos(value) || overrideWithGeo) {
                setPosition(newPos);
                onChange(newPos);

                // center map
                if (mapRef.current) {
                    mapRef.current.setView([newPos.lat, newPos.lng]);
                    setTimeout(() => mapRef.current.invalidateSize(), 200);
                }
            }

            // รีเซ็ต flag หลังใช้งาน
            if (overrideWithGeo) {
                setOverrideWithGeo(false);
            }
        }
    }, [geoLoc, value, overrideWithGeo, onChange]);

    // 4) ปุ่ม “ใช้ตำแหน่งปัจจุบัน” จะตั้ง flag แล้วเรียก getCurrentLocation()
    const handleUseCurrent = () => {
        setOverrideWithGeo(true);
        getCurrentLocation();
    };

    // 5) Marker draggable & click event
    const DraggableMarker = () => {
        useMapEvents({
            click: e => {
                const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                setPosition(newPos);
                onChange(newPos);
            },
        });
        if (!isValidPos(position)) return null;
        return (
            <Marker
                draggable
                position={[position.lat, position.lng]}
                eventHandlers={{
                    dragend: e => {
                        const { lat, lng } = e.target.getLatLng();
                        const newPos = { lat, lng };
                        setPosition(newPos);
                        onChange(newPos);
                    },
                }}
            />
        );
    };

    // center fallback
    const safeCenter = isValidPos(position)
        ? [position.lat, position.lng]
        : [DEFAULT_POSITION.lat, DEFAULT_POSITION.lng];

    return (
        <div>
            <div style={{ textAlign: "right", marginBottom: 6 }}>
                <Button onClick={handleUseCurrent} size="small">
                    ใช้ตำแหน่งปัจจุบัน
                </Button>
            </div>

            <Spin spinning={geoLoading}>
                <MapContainer
                    center={safeCenter}
                    zoom={17}
                    whenCreated={map => (mapRef.current = map)}
                    style={{ height: 220, width: "100%", borderRadius: 8 }}
                    scrollWheelZoom={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <DraggableMarker />
                    <ResetMapCenter center={safeCenter} />
                </MapContainer>
            </Spin>

            {geoError && (
                <div style={{ color: "red", textAlign: "center", marginTop: 4 }}>
                    ไม่สามารถดึงตำแหน่ง: {geoError}
                </div>
            )}

            <div style={{ textAlign: "center", margin: 8, fontSize: 16 }}>
                Lat: <b>{safeCenter[0].toFixed(6)}</b> | Lng: <b>{safeCenter[1].toFixed(6)}</b>
            </div>
        </div>
    );
};

export default LocationPicker;
