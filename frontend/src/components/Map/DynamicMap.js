import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import * as FaIcons from 'react-icons/fa';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


const DynamicMap = ({ layers, geoObjects, visibleLayerIds, onSelectObject, center, zoom }) => {

    const getIcon = (iconName = 'FaBeer') => {
        if (!iconName || !FaIcons[iconName]) {
            return new L.Icon.Default();
        }

        const IconComponent = FaIcons[iconName];
        const iconHtml = ReactDOMServer.renderToString(<IconComponent />);

        return L.divIcon({
            html: iconHtml,
            className: 'custom-react-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24],
        });
    };

    const renderObject = (object, layer) => {
        const { color, icon } = layer;
        const objectName = object.properties?.name || object.properties?.label || 'Unnamed Object';

        const eventHandlers = {
            click: () => {
                onSelectObject(object);
            },
        };

        switch (object.geometry.type) {
            case 'Point':
                const position = [object.geometry.coordinates[1], object.geometry.coordinates[0]];
                const markerIcon = getIcon(icon);
                return (
                    <Marker position={position} icon={markerIcon} eventHandlers={eventHandlers}>
                        <Popup>{objectName}</Popup>
                    </Marker>
                );
            case 'Polygon':
                const polygonCoords = object.geometry.coordinates[0].map(p => [p[1], p[0]]);
                return (
                    <Polygon pathOptions={{ color }} positions={polygonCoords} eventHandlers={eventHandlers}>
                         <Popup>{objectName}</Popup>
                    </Polygon>
                );
            case 'LineString':
                const lineCoords = object.geometry.coordinates.map(p => [p[1], p[0]]);
                return (
                    <Polyline pathOptions={{ color }} positions={lineCoords} eventHandlers={eventHandlers}>
                         <Popup>{objectName}</Popup>
                    </Polyline>
                );
            default:
                return null;
        }
    };

    return (
        <MapContainer center={center || [7.8883203, 98.3979144]} zoom={zoom || 15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxNativeZoom={19}
                maxZoom={22}
            />
            {layers
                .filter(layer => visibleLayerIds.includes(layer._id))
                .map(layer => {
                    const objects = geoObjects[layer._id] || [];
                    return objects.map(obj => (
                        <React.Fragment key={obj._id}>
                            {renderObject(obj, layer)}
                        </React.Fragment>
                    ));
                })
            }
        </MapContainer>
    );
};

export default DynamicMap;
