import React, { useEffect, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const ZoomAdaptiveMarker = ({ center }) => {
    const map = useMap();
    const [showPopup, setShowPopup] = useState(false);
    const [icon, setIcon] = useState(null);

    // สร้าง icon ตาม zoom
    const updateIcon = () => {
        const zoom = map.getZoom();

        let size = 12 + (zoom - 13) * 1.6;
        size = Math.round(size);
        size = Math.max(12, Math.min(size, 20));
        
        setIcon(
            new L.Icon({
                iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png",
                iconSize: [size, size * 1.5],
                iconAnchor: [size / 2, size * 1.5],
                popupAnchor: [0, -size],
            })
        );
    };

    useEffect(() => {
        updateIcon();
        map.on("zoomend", updateIcon);
        return () => map.off("zoomend", updateIcon);
        // eslint-disable-next-line
    }, [map]);

    useEffect(() => setShowPopup(false), [center]);

    if (!center || typeof center[0] !== "number" || typeof center[1] !== "number" || !icon) {
        return null;
    }

    return (
        <Marker
            position={center}
            icon={icon}
            eventHandlers={{
                click: () => setShowPopup(true)
            }}
        >
            {showPopup && (
                <Popup
                    position={center}
                    onClose={() => setShowPopup(false)}
                >
                    ตำแหน่งของคุณ<br />
                    พิกัด: {center[0]}, {center[1]}
                </Popup>
            )}
        </Marker>
    );
};

export default ZoomAdaptiveMarker;
