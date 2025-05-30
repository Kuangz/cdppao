import { useState, useEffect, useCallback, useRef } from "react";

export default function useCurrentLocation(options = {}) {
    // เก็บ options ครั้งแรกไว้ใน ref (คงที่ตลอดอายุของ hook นี้)
    const optionsRef = useRef(options);

    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const getCurrentLocation = useCallback(() => {
        setLoading(true);

        const fallbackToIP = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                setLocation({ lat: data.latitude, lng: data.longitude });
            } catch (e) {
                setError("Failed to get location from IP");
            } finally {
                setLoading(false);
            }
        };

        if (!navigator.geolocation) {
            fallbackToIP();
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
            () => {
                fallbackToIP();
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000,
                ...optionsRef.current, // ✅ ปลอดภัย ไม่ trigger loop
            }
        );
    }, []); // ไม่มี dependency เพราะ options ไม่เปลี่ยน

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
