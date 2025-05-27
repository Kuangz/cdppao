import { useEffect } from "react";
import { useMap } from "react-leaflet";

const SetMapCenter = ({ position, trigger, onCentered }) => {
    const map = useMap();

    useEffect(() => {
        // ต้องเช็กว่า trigger จริง, และ position ไม่ว่าง
        if (trigger && position && position.lat && position.lng) {
            // เช็กว่ามี map จริงๆ
            if (map) {
                map.setView([position.lat, position.lng], map.getZoom(), {
                    animate: true,
                });
                if (typeof onCentered === "function") {
                    onCentered();
                }
            }
        }
        // eslint-disable-next-line
    }, [trigger, position?.lat, position?.lng]);

    return null;
};

export default SetMapCenter;
