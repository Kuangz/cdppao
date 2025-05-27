import React, { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import * as toGeoJSON from "@tmcw/togeojson";

const GeoJsonShape = ({ url }) => {
    const [geojson, setGeojson] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function load() {
            try {
                const kmlRes = await fetch(url);
                const kmlText = await kmlRes.text();
                const parser = new DOMParser();
                const kmlDom = parser.parseFromString(kmlText, "application/xml");
                const gj = toGeoJSON.kml(kmlDom);
                if (isMounted) setGeojson(gj);
            } catch (err) {
                console.error("KML load error:", err);
            }
        }
        load();
        return () => { isMounted = false; };
    }, [url]);

    if (!geojson) return null;
    return <GeoJSON data={geojson} style={{ color: "#1565c0", weight: 2, fillOpacity: 0.1 }} />;
};

export default GeoJsonShape;
