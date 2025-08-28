import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const MapUpdater = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            const latLng = L.latLng(center[0], center[1]);
            // Use flyTo for a smooth animation to the new center
            map.flyTo(latLng, zoom || map.getZoom(), {
                animate: true,
                duration: 1.5 // Animation duration in seconds
            });
        }
    }, [center, zoom, map]);

    return null; // This component does not render anything
};

export default MapUpdater;
