import React, { useState, useEffect, useCallback } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import ReactDOMServer from "react-dom/server";
import L from "leaflet";
import { DeleteOutlined } from "@ant-design/icons";

// Status to color
const BIN_STATUS_COLOR = {
    active: "#388e3c",
    broken: "#e53935",
    lost: "#ffa726",
    removed: "#616161",
    replaced: "#1976d2",
    installed: "#00bcd4",
    deleted: "#bdbdbd"
};

const MarkerWithZoomIcon = ({
    position,
    status,
    isSelected,
    onClick,
    popupContent
}) => {
    const [icon, setIcon] = useState(null);
    const map = useMap();

    const updateIcon = useCallback((zoom = 14) => {
        let size = 12 + (zoom - 10) * 2;
        size = Math.round(size);
        size = Math.max(15, Math.min(size, 32));
        const color = BIN_STATUS_COLOR[status] || "#bdbdbd";

        setIcon(
            new L.DivIcon({
                html: ReactDOMServer.renderToString(
                    <div
                        style={{
                            background: isSelected ? color : "#fff",
                            border: `2.2px solid ${color}`,
                            borderRadius: "50%",
                            boxShadow: isSelected
                                ? `0 2px 14px ${color}55`
                                : "0 1px 7px #bdbdbd99",
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
                                color: isSelected ? "#fff" : color,
                                fontSize: size * 0.7,
                                transition: "color 0.18s"
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
    }, [isSelected, status]);

    useEffect(() => {
        if (!map) return;
        const onZoom = () => updateIcon(map.getZoom());
        map.on("zoomend", onZoom);
        updateIcon(map.getZoom());
        return () => map.off("zoomend", onZoom);
    }, [map, updateIcon]);

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
