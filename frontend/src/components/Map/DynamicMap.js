import React from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapUpdater from './MapUpdater';

// Helper to generate a color from a string (layer ID)
const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};


// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


const DynamicMap = ({ layers, geoObjects, visibleLayerIds, onSelectObject, center, zoom }) => {

    const renderObject = (object, layer) => {
        const color = stringToColor(layer._id);
        const objectName = object.properties?.name || object.properties?.label || 'Unnamed Object';

        const eventHandlers = {
            click: () => {
                onSelectObject(object);
            },
        };

        switch (object.geometry.type) {
            case 'Point':
                // Leaflet expects [lat, lng]
                const position = [object.geometry.coordinates[1], object.geometry.coordinates[0]];
                return (
                    <Marker position={position} eventHandlers={eventHandlers}>
                        <Popup>{objectName}</Popup>
                    </Marker>
                );
            case 'Polygon':
                // Leaflet expects array of [lat, lng]
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
        <MapContainer center={[13.7563, 100.5018]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <MapUpdater center={center} zoom={zoom} />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
