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
                console.log("Fallback to IP location...");
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                setLocation({ lat: data.latitude, lng: data.longitude });
                console.log("IP location:", data.latitude, data.longitude);
            } catch (e) {
                setError("Failed to get location from IP");
                console.error("Failed to get location from IP:", e);
            } finally {
                setLoading(false);
            }
        };

        if (!navigator.geolocation) {
            console.log("No geolocation support");
            fallbackToIP();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("Got GPS position:", pos.coords.latitude, pos.coords.longitude);
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error("Geo error", err);
                fallbackToIP();
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
        console.log("useCurrentLocation: Call getCurrentLocation");
        getCurrentLocation();
    }, [getCurrentLocation]);

    return {
        location,
        locating: loading,
        error,
        getCurrentLocation,
    };
}
