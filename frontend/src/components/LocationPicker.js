import React, { useEffect, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Spin } from "antd";
import { useLocation } from "../contexts/LocationContext";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet marker icon path (CRA, Vite, Production)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const DEFAULT_POSITION = { lat: 7.8804, lng: 98.3923 };

const isValidPos = (pos) =>
    pos && typeof pos.lat === "number" && typeof pos.lng === "number";

const ResetMapCenter = ({ center }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (Array.isArray(center) && center.length === 2) {
            map.setView(center);
            setTimeout(() => {
                try {
                    map.invalidateSize();
                } catch { }
            }, 200);
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ value, onChange }) => {
    const mapRef = useRef(null);
    // position state ใช้ค่า initial จาก value หรือ context (geoLoc)
    const {
        location: geoLoc,
        locating,
        error: geoError,
        getCurrentLocation,
    } = useLocation();

    // state ของ marker
    const [position, setPosition] = useState(
        isValidPos(value)
            ? value
            : isValidPos(geoLoc)
                ? geoLoc
                : null
    );
    const [overrideWithGeo, setOverrideWithGeo] = useState(false);

    // sync เมื่อ value (prop) เปลี่ยน (เช่น edit)
    useEffect(() => {
        if (
            isValidPos(value) &&
            (!isValidPos(position) ||
                value.lat !== position.lat ||
                value.lng !== position.lng)
        ) {
            setPosition(value);
        }
    }, [value, position]); // intentionallyไม่ใส่ position ใน dep เพื่อกัน loop

    // ดึงตำแหน่งอัตโนมัติเมื่อ mount (value, position ยังไม่มี)
    useEffect(() => {
        if (!isValidPos(value) && !isValidPos(position)) {
            getCurrentLocation();
        }
    }, [value, position, getCurrentLocation]);

    // sync geoLoc → position (กรณี create/new หรือ context เปลี่ยน)
    useEffect(() => {
        if (!isValidPos(value) && isValidPos(geoLoc)) {
            setPosition(geoLoc);
            onChange?.(geoLoc);
        }
        // eslint-disable-next-line
    }, [geoLoc, value, onChange]);

    // ถ้ากดปุ่ม "ใช้ตำแหน่งปัจจุบัน" → override
    useEffect(() => {
        if (!isValidPos(geoLoc)) return;
        if (overrideWithGeo) {
            if (
                !isValidPos(position) ||
                geoLoc.lat !== position.lat ||
                geoLoc.lng !== position.lng
            ) {
                setPosition(geoLoc);
                onChange?.(geoLoc);

                if (mapRef.current) {
                    mapRef.current.setView([geoLoc.lat, geoLoc.lng], 17);
                    setTimeout(() => {
                        try {
                            mapRef.current.invalidateSize();
                        } catch { }
                        setOverrideWithGeo(false);
                    }, 200);
                } else {
                    setOverrideWithGeo(false);
                }
            } else {
                setOverrideWithGeo(false);
            }
        }
        // eslint-disable-next-line
    }, [geoLoc, overrideWithGeo]);

    const handleUseCurrent = () => {
        setOverrideWithGeo(true);
        getCurrentLocation();
    };

    const DraggableMarker = () => {
        useMapEvents({
            click: (e) => {
                const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                setPosition(newPos);
                onChange?.(newPos);
            },
        });

        return position ? (
            <Marker
                draggable
                position={[position.lat, position.lng]}
                eventHandlers={{
                    dragend: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        const newPos = { lat, lng };
                        setPosition(newPos);
                        onChange?.(newPos);
                    },
                }}
            />
        ) : null;
    };

    const center = isValidPos(position)
        ? [position.lat, position.lng]
        : [DEFAULT_POSITION.lat, DEFAULT_POSITION.lng];

    return (
        <div>
            <div style={{ textAlign: "right", marginBottom: 6 }}>
                <Button onClick={handleUseCurrent} size="small">
                    ใช้ตำแหน่งปัจจุบัน
                </Button>
            </div>
            <Spin spinning={locating}>
                <MapContainer
                    center={center}
                    zoom={17}
                    whenCreated={(map) => (mapRef.current = map)}
                    style={{ height: 220, width: "100%", borderRadius: 8 }}
                    scrollWheelZoom={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <DraggableMarker />
                    <ResetMapCenter center={center} />
                </MapContainer>
            </Spin>

            {geoError && (
                <div style={{ color: "red", textAlign: "center", marginTop: 4 }}>
                    ไม่สามารถดึงตำแหน่ง: {geoError}
                </div>
            )}

            <div style={{ textAlign: "center", margin: 8, fontSize: 16 }}>
                Lat: <b>{center[0].toFixed(6)}</b> | Lng: <b>{center[1].toFixed(6)}</b>
            </div>
        </div>
    );
};

export default LocationPicker;
