// src/components/Map/DynamicMap.jsx
import React, { useMemo } from 'react';
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, Popup, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import * as FaIcons from 'react-icons/fa';

// ✅ Vite-friendly asset imports (แทน require)
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon for Leaflet (Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: marker2x,
    iconUrl: marker1x,
    shadowUrl: markerShadow,
});

const DynamicMap = ({ layers = [], geoObjects = {}, visibleLayerIds = [], onSelectObject, center, zoom }) => {
    // 🔒 กัน null ใน callback
    const handleSelect = (obj) => {
        if (onSelectObject) onSelectObject(obj);
    };

    // ⚡️ แคช divIcon ต่อ iconName+color ไม่ต้องเรนเดอร์ซ้ำ
    const iconCache = useMemo(() => new Map(), []);
    const getIcon = (iconName = 'FaMapMarkerAlt', color = '#000') => {
        const key = `${iconName}-${color}`;
        if (iconCache.has(key)) return iconCache.get(key);

        const IconComponent = FaIcons[iconName];
        if (!IconComponent) {
            const def = new L.Icon.Default();
            iconCache.set(key, def);
            return def;
        }

        const html = ReactDOMServer.renderToString(<IconComponent style={{ color, width: 24, height: 24 }} />);
        const divIcon = L.divIcon({
            html,
            className: 'custom-react-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24],
        });
        iconCache.set(key, divIcon);
        return divIcon;
    };

    const renderObject = (object, layer) => {
        const layerColor = layer?.color || '#2E86DE';
        const iconName = layer?.icon || 'FaMapMarkerAlt';
        const name =
            object?.properties?.name ||
            object?.properties?.label ||
            object?.properties?.title ||
            'Unnamed Object';

        const eventHandlers = { click: () => handleSelect(object) };

        switch (object?.geometry?.type) {
            case 'Point': {
                const [lng, lat] = object.geometry.coordinates;
                return (
                    <Marker
                        position={[lat, lng]}
                        icon={getIcon(iconName, layerColor)}
                        eventHandlers={eventHandlers}
                    >
                        <Popup>{name}</Popup>
                    </Marker>
                );
            }
            case 'MultiPoint': {
                const icon = getIcon(iconName, layerColor);
                return (
                    <FeatureGroup eventHandlers={eventHandlers}>
                        {object.geometry.coordinates.map((c, i) => (
                            <Marker key={i} position={[c[1], c[0]]} icon={icon} />
                        ))}
                        <Popup>{name}</Popup>
                    </FeatureGroup>
                );
            }
            case 'Polygon': {
                const positions = object.geometry.coordinates.map(ring => ring.map(p => [p[1], p[0]]));
                return (
                    <Polygon pathOptions={{ color: layerColor }} positions={positions} eventHandlers={eventHandlers}>
                        <Popup>{name}</Popup>
                    </Polygon>
                );
            }
            case 'MultiPolygon': {
                return (
                    <FeatureGroup pathOptions={{ color: layerColor }} eventHandlers={eventHandlers}>
                        {object.geometry.coordinates.map((poly, i) => {
                            const positions = poly.map(ring => ring.map(p => [p[1], p[0]]));
                            return <Polygon key={i} positions={positions} />;
                        })}
                        <Popup>{name}</Popup>
                    </FeatureGroup>
                );
            }
            case 'LineString': {
                const positions = object.geometry.coordinates.map(p => [p[1], p[0]]);
                return (
                    <Polyline pathOptions={{ color: layerColor }} positions={positions} eventHandlers={eventHandlers}>
                        <Popup>{name}</Popup>
                    </Polyline>
                );
            }
            case 'MultiLineString': {
                return (
                    <FeatureGroup pathOptions={{ color: layerColor }} eventHandlers={eventHandlers}>
                        {object.geometry.coordinates.map((line, i) => {
                            const positions = line.map(p => [p[1], p[0]]);
                            return <Polyline key={i} positions={positions} />;
                        })}
                        <Popup>{name}</Popup>
                    </FeatureGroup>
                );
            }
            default:
                return null;
        }
    };

    const visibleLayers = useMemo(
        () => layers.filter(l => visibleLayerIds.includes(l._id)),
        [layers, visibleLayerIds]
    );

    return (
        <MapContainer
            center={center || [7.8883203, 98.3979144]}
            zoom={zoom ?? 15}
            style={{ height: '100%', width: '100%' }}
            preferCanvas
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxNativeZoom={19}
                maxZoom={20}
            />

            {visibleLayers.map(layer => {
                const objects = geoObjects[layer._id] || [];
                return objects.map(obj => (
                    <React.Fragment key={obj._id || `${layer._id}-${obj?.properties?.id || Math.random()}`}>
                        {renderObject(obj, layer)}
                    </React.Fragment>
                ));
            })}
        </MapContainer>
    );
};

export default DynamicMap;
