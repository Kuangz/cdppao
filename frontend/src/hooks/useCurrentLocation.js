import React, { useState, useCallback } from "react";

const DEFAULT_POSITION = { lat: 7.8804, lng: 98.3923 };

export default function useCurrentLocation(auto = true) {
    const [location, setLocation] = useState(null);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState(null);

    const getCurrentLocation = useCallback(() => {
        setLocating(true);
        setError(null);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocating(false);
                },
                (err) => {
                    setLocation(DEFAULT_POSITION); // fallback ตอน error
                    setError(err.message || "ไม่สามารถดึงตำแหน่งได้");
                    setLocating(false);
                }
            );
        } else {
            setLocation(DEFAULT_POSITION); // fallback ถ้าไม่รองรับ
            setError("ไม่รองรับ geolocation");
            setLocating(false);
        }
    }, []);

    // หากต้องการ auto ขอพิกัดครั้งแรก
    React.useEffect(() => {
        if (auto) getCurrentLocation();
        // eslint-disable-next-line
    }, []);

    return {
        location,
        setLocation,   // ถ้าอยาก force set เองจาก parent
        locating,
        error,
        getCurrentLocation,
    };
}
