import { useState, useEffect, useCallback, useRef } from "react";

export default function useCurrentLocation(options = {}) {
    // เก็บ options ครั้งแรกไว้ใน ref (คงที่ตลอดอายุของ hook นี้)
    const optionsRef = useRef(options);

    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const getCurrentLocation = useCallback(() => {
        setLoading(true);

        if (!navigator.geolocation) {
            setError("อุปกรณ์ไม่รองรับการระบุตำแหน่ง");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setError(null);
                setLoading(false);
            },
            (err) => {
                setError(err.message || "ไม่สามารถดึงตำแหน่งได้");
                setLoading(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000,
                ...optionsRef.current,
            }
        );
    }, []);

    useEffect(() => {
        getCurrentLocation();
    }, [getCurrentLocation]);

    return {
        location,
        locating: loading,
        error,
        getCurrentLocation,
    };
}
