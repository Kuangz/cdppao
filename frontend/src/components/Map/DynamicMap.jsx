import React, { useMemo } from 'react';
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, Popup, FeatureGroup, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import * as FaIcons from 'react-icons/fa';
import { Button } from 'antd';
import { AimOutlined } from '@ant-design/icons';

// ✅ Vite-friendly asset imports
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

const LocateControl = () => {
    const map = useMap();

    const handleLocate = (e) => {
        e.stopPropagation(); // Prevent map click propagation
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, map.getZoom());
        });
    };

    return (
        <div
            className="leaflet-control" // Add standard leaflet control class for basic styling/behavior if needed, or just custom
            style={{
                position: 'absolute',
                bottom: '90px', // Inspecting leaflet-bottom leaflet-right usually starts at 0 or 10px. Zoom control is approx 70-80px tall?
                // Standard zoom control is usually around 50-60px + margins.
                // Let's position it just above the zoom control.
                right: '10px',
                zIndex: 1000, // Ensure it's above map tiles
                pointerEvents: 'auto'
            }}
        >
            <Button
                icon={<AimOutlined style={{ fontSize: '20px' }} />} // Slightly larger icon
                onClick={handleLocate}
                title="ตำแหน่งของฉัน" // Translate to Thai
                style={{
                    width: '32px', // Standard leaflet control size is 30-34px
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    borderRadius: '4px',
                    boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
                    border: 'none',
                    background: '#fff',
                    color: '#333'
                }}
            />
        </div>
    );
};

const DeselectHandler = ({ onSelect }) => {
    useMapEvents({
        click: () => {
            if (onSelect) onSelect(null);
        },
    });
    return null;
};

const DynamicMap = ({ layers = [], geoObjects = {}, visibleLayerIds = [], onSelectObject, selectedObject, center, zoom }) => {
    const [hoveredObject, setHoveredObject] = React.useState(null);

    const handleSelect = (obj) => {
        if (onSelectObject) onSelectObject(obj);
    };

    // ⚡️ Cache divIcon per iconName+color+size
    const iconCache = useMemo(() => new Map(), []);
    const getIcon = (iconName = 'FaMapMarkerAlt', color = '#000', size = 24) => {
        const key = `${iconName}-${color}-${size}`;
        if (iconCache.has(key)) return iconCache.get(key);

        const IconComponent = FaIcons[iconName];
        if (!IconComponent) {
            const def = new L.Icon.Default();
            iconCache.set(key, def);
            return def;
        }

        const html = ReactDOMServer.renderToString(<IconComponent style={{ color, width: size, height: size }} />);
        const divIcon = L.divIcon({
            html,
            className: 'custom-react-icon',
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size],
        });
        iconCache.set(key, divIcon);
        return divIcon;
    };

    const renderPopupContent = (object, name) => (
        <div style={{ textAlign: 'center', fontFamily: 'Noto Sans Thai, sans-serif' }}>
            <h4 style={{ margin: '0 0 8px 0', fontFamily: 'inherit' }}>{name}</h4>
            <Button size="small" type="primary" onClick={() => handleSelect(object)}>
                ดูรายละเอียด
            </Button>
        </div>
    );

    const renderObject = (object, layer) => {
        const isSelected = selectedObject?._id === object._id;
        const isHovered = hoveredObject?._id === object._id;

        let layerColor = object?.properties?.color || layer?.color || '#2E86DE';
        const iconName = layer?.icon || 'FaMapMarkerAlt';
        let name = 'Unnamed Object';
        const primaryDisplayField = layer?.displaySettings?.importantFields?.[0];
        if (primaryDisplayField && object?.properties?.[primaryDisplayField]) {
            name = object.properties[primaryDisplayField];
        } else {
            name = object?.properties?.name ||
                object?.properties?.label ||
                object?.properties?.title ||
                'Unnamed Object';
        }

        // Highlight Styles
        if (isSelected) {
            layerColor = '#FF4D4F'; // Highlight selected with red/accent
        } else if (isHovered) {
            // function to lighten/darken or just use a distinct hover color?
            // Let's keep original color but maybe boost opacity or weight for lines
        }

        // Prevent map click from also firing when clicking an object
        const commonEventHandlers = {
            click: (e) => {
                // Stop propagation to the map container
                if (e && e.originalEvent) e.originalEvent.stopPropagation();
                handleSelect(object);
            },
            mouseover: () => setHoveredObject(object),
            mouseout: () => setHoveredObject(null)
        };

        const pathOptions = {
            color: layerColor,
            fillOpacity: isSelected || isHovered ? 0.6 : 0.3,
            weight: isSelected || isHovered ? 5 : 3,
            opacity: isSelected || isHovered ? 1 : 0.7
        };

        switch (object?.geometry?.type) {
            case 'Point': {
                const [lng, lat] = object.geometry.coordinates;
                const size = isSelected || isHovered ? 32 : 24; // Enlarge icon on hover/select
                return (
                    <Marker
                        position={[lat, lng]}
                        icon={getIcon(iconName, layerColor, size)}
                        eventHandlers={commonEventHandlers}
                        zIndexOffset={isSelected || isHovered ? 1000 : 0}
                    >
                        <Popup>{renderPopupContent(object, name)}</Popup>
                    </Marker>
                );
            }
            case 'MultiPoint': {
                const size = isSelected || isHovered ? 32 : 24;
                const icon = getIcon(iconName, layerColor, size);
                return (
                    <FeatureGroup eventHandlers={commonEventHandlers}>
                        {object.geometry.coordinates.map((c, i) => (
                            <Marker key={i} position={[c[1], c[0]]} icon={icon} zIndexOffset={isSelected || isHovered ? 1000 : 0} />
                        ))}
                        <Popup>{renderPopupContent(object, name)}</Popup>
                    </FeatureGroup>
                );
            }
            case 'Polygon': {
                const positions = object.geometry.coordinates.map(ring => ring.map(p => [p[1], p[0]]));
                return (
                    <Polygon pathOptions={pathOptions} positions={positions} eventHandlers={commonEventHandlers}>
                        <Popup>{renderPopupContent(object, name)}</Popup>
                        <Tooltip permanent direction="center" className="polygon-label-tooltip" opacity={isSelected || isHovered ? 1 : 0.7}>
                            {name}
                        </Tooltip>
                    </Polygon>
                );
            }
            case 'MultiPolygon': {
                return (
                    <FeatureGroup eventHandlers={commonEventHandlers}>
                        {object.geometry.coordinates.map((poly, i) => {
                            const positions = poly.map(ring => ring.map(p => [p[1], p[0]]));
                            return <Polygon key={i} positions={positions} pathOptions={pathOptions} />;
                        })}
                        <Popup>{renderPopupContent(object, name)}</Popup>
                        <Tooltip permanent direction="center" className="polygon-label-tooltip" opacity={isSelected || isHovered ? 1 : 0.7}>
                            {name}
                        </Tooltip>
                    </FeatureGroup>
                );
            }

            case 'LineString': {
                const positions = object.geometry.coordinates.map(p => [p[1], p[0]]);
                return (
                    <Polyline pathOptions={pathOptions} positions={positions} eventHandlers={commonEventHandlers}>
                        <Popup>{renderPopupContent(object, name)}</Popup>
                    </Polyline>
                );
            }
            case 'MultiLineString': {
                return (
                    <FeatureGroup eventHandlers={commonEventHandlers}>
                        {object.geometry.coordinates.map((line, i) => {
                            const positions = line.map(p => [p[1], p[0]]);
                            return <Polyline key={i} positions={positions} pathOptions={pathOptions} />;
                        })}
                        <Popup>{renderPopupContent(object, name)}</Popup>
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
            zoomControl={false} // Disable default zoom control
        >
            {/* Custom controls */}
            <ZoomControl position="bottomright" />
            <LocateControl />
            {/* Deselect when clicking empty map area */}
            <DeselectHandler onSelect={onSelectObject} />

            <TileLayer
                // CartoDB Positron (Light)
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
