import React from "react";
import { useMap } from "react-leaflet";
import { Button } from "antd";
import { GlobalOutlined } from "@ant-design/icons";

// Default center and zoom
const DEFAULT_CENTER = [7.885, 98.3923];
const DEFAULT_ZOOM = 14;

export function ZoomToDefaultButton({ style }) {
    const map = useMap();

    const handleClick = () => {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
    };

    return (
        <Button
            type="primary"
            icon={<GlobalOutlined />}
            onClick={handleClick}
            style={{
                position: "absolute",
                bottom: 18,
                right: 18,
                zIndex: 1000,
                boxShadow: "0 2px 10px 0 #0001",
                ...style,
            }}
            title="กลับไปยังตำแหน่งเริ่มต้น"
        >
            ภาพรวม
        </Button>
    );
}
