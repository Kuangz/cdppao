import React, { useEffect, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Spin } from "antd";
import L from "leaflet";
import { useLocation } from "../contexts/LocationContext";

// Fix icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const DEFAULT_POSITION = { lat: 7.8804, lng: 98.3923 };

const isValidPos = (pos) =>
    pos && typeof pos.lat === "number" && typeof pos.lng === "number";

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

const LocationPicker = ({ value, onChange }) => {
    const mapRef = useRef(null);
    const [position, setPosition] = useState(
        isValidPos(value) ? value : null
    );
    const [overrideWithGeo, setOverrideWithGeo] = useState(false);

    const {
        location: geoLoc,
        locating,
        error: geoError,
        getCurrentLocation,
    } = useLocation();

    useEffect(() => {
        if (isValidPos(value)) setPosition(value);
    }, [value]);

    useEffect(() => {
        if (!isValidPos(value)) getCurrentLocation();
    }, [value, getCurrentLocation]);

    useEffect(() => {
        if (!isValidPos(geoLoc)) return;

        const newPos = { lat: geoLoc.lat, lng: geoLoc.lng };
        const shouldOverride = !isValidPos(value) || overrideWithGeo;

        if (shouldOverride) {
            setPosition(newPos);
            onChange?.(newPos);
            if (mapRef.current) {
                mapRef.current.setView([newPos.lat, newPos.lng], 17);
                setTimeout(() => {
                    mapRef.current.invalidateSize();
                    setOverrideWithGeo(false);
                }, 200);
            }
        }
    }, [geoLoc, overrideWithGeo, value, onChange]);

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
