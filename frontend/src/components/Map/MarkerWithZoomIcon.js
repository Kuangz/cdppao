import React, { useState, useEffect, useCallback } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import ReactDOMServer from "react-dom/server";
import L from "leaflet";
import { DeleteOutlined } from "@ant-design/icons";

const MarkerWithZoomIcon = ({ position, isSelected, onClick, popupContent }) => {
    const [icon, setIcon] = useState(null);
    const map = useMap();

    const updateIcon = useCallback((zoom = 14) => {
        let size = 12 + (zoom - 10) * 2;
        size = Math.round(size);
        size = Math.max(15, Math.min(size, 30));
        setIcon(
            new L.DivIcon({
                html: ReactDOMServer.renderToString(
                    <div
                        style={{
                            background: isSelected
                                ? "linear-gradient(135deg, #156834 70%, #388e3c 100%)" // เขียวเข้ม → เขียวกลาง
                                : "rgba(255,255,255,0.97)",
                            borderRadius: "50%",
                            boxShadow: isSelected
                                ? "0 2px 18px #15683499"
                                : "0 2px 8px #b0c4b1a1",
                            width: size,
                            height: size,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                        }}
                    >
                        <DeleteOutlined
                            style={{
                                color: isSelected ? "#fff" : "#388e3c",
                                fontSize: size * 0.7,
                            }}
                        />
                    </div>

                ),
                className: "",
                iconSize: [size, size],
                iconAnchor: [size / 2, size],
                popupAnchor: [0, -size / 1.7],
            })
        );
    }, [isSelected]);

    // อัพเดท icon ตอน zoom เปลี่ยน
    useEffect(() => {
        if (!map) return;
        const onZoom = () => updateIcon(map.getZoom());
        map.on("zoomend", onZoom);
        // initial set
        updateIcon(map.getZoom());
        return () => map.off("zoomend", onZoom);
    }, [map, updateIcon]);

    // ป้องกันพิกัดผิด (undefined/null)
    if (
        !position ||
        typeof position[0] !== "number" ||
        typeof position[1] !== "number"
    ) {
        return null;
    }

    return icon ? (
        <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
            {popupContent && <Popup>{popupContent}</Popup>}
        </Marker>
    ) : null;
};

export default MarkerWithZoomIcon;
