import { useState, useEffect } from "react";

export default function useResponsiveMapHeight(desktop = 600, mobile = 320) {
    const [mapHeight, setMapHeight] = useState(
        window.innerWidth < 768 ? mobile : desktop
    );

    useEffect(() => {
        const handleResize = () => {
            setMapHeight(window.innerWidth < 768 ? mobile : desktop);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [desktop, mobile]);

    return mapHeight;
}
