import { useMap } from "react-leaflet";
import React, { useEffect, useState } from "react";

const ZoomLevelDisplay = ({ style }) => {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());

    useEffect(() => {
        const update = () => setZoom(map.getZoom());
        map.on("zoomend", update);
        return () => map.off("zoomend", update);
    }, [map]);

    return (
        <div
            style={{
                position: "absolute",
                top: 18,
                left: 18,
                background: "rgba(255,255,255,0.86)",
                color: "#1976d2",
                borderRadius: 8,
                padding: "2px 14px",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 1px 4px rgba(0,0,0,0.09)",
                zIndex: 1200,
                ...style,
            }}
        >
            Zoom: {zoom}
        </div>
    );
};

export default ZoomLevelDisplay;
