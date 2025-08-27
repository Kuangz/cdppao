import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Spin, message, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getLayers } from '../api/layer';
import { getGeoObjectsByLayer, createGeoObject, updateGeoObject } from '../api/geoObject';
import { Image, Space } from 'antd';
import DynamicMap from '../components/Map/DynamicMap';
import LayerControl from '../components/LayerControl';
import GeoObjectForm from '../components/GeoObjectForm';
import ObjectDetailCard from '../components/ObjectDetailCard';
import useCurrentLocation from '../hooks/useCurrentLocation';
import useResponsiveMapHeight from '../hooks/useResponsiveMapHeight';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Dashboard = () => {
    const [layers, setLayers] = useState([]);
    const [geoObjects, setGeoObjects] = useState({}); // { layerId: [objects] }
    const [visibleLayerIds, setVisibleLayerIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState(null);
    const [isPanelVisible, setPanelVisible] = useState(true);
    const [panelMode, setPanelMode] = useState('details'); // 'details', 'create', 'edit'

    const navigate = useNavigate();
    const { location } = useCurrentLocation(true);
    // const mapHeight = useResponsiveMapHeight(600, 400); // Deprecated for full height

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch all layer definitions
            const layerRes = await getLayers();
            const fetchedLayers = layerRes.data || [];
            setLayers(fetchedLayers);

            // 2. Set all layers to be visible by default
            setVisibleLayerIds(fetchedLayers.map(l => l._id));

            // 3. Fetch geo-objects for each layer concurrently
            const objectPromises = fetchedLayers.map(layer => getGeoObjectsByLayer(layer._id));
            const objectResults = await Promise.all(objectPromises);

            // 4. Populate the geoObjects state
            const newGeoObjects = {};
            fetchedLayers.forEach((layer, index) => {
                newGeoObjects[layer._id] = objectResults[index].data || [];
            });
            setGeoObjects(newGeoObjects);

        } catch (err) {
            message.error("Failed to load map data.");
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSelectObject = useCallback((object) => {
        setSelectedObject(object);
        setPanelMode('details'); // Switch to details view when a new object is selected
        setPanelVisible(true);
    }, []);

    const handleFormSubmit = async (formData) => {
        try {
            if (panelMode === 'create') {
                await createGeoObject(formData);
                message.success('Object created successfully!');
            } else if (panelMode === 'edit' && selectedObject) {
                await updateGeoObject(selectedObject._id, formData);
                message.success('Object updated successfully!');
            }
            setPanelMode('details');
            loadData(); // Reload all data to reflect changes
        } catch (error) {
            message.error('Failed to save object.');
            console.error("Form submission error:", error);
        }
    };

    const handleVisibilityChange = (newVisibleIds) => {
        setVisibleLayerIds(newVisibleIds);
    };

    // Assuming a header height of ~64px. This can be adjusted.
    const mapHeight = 'calc(100vh - 64px)';
    const centerStyle = { textAlign: "center", padding: 64, height: mapHeight, display: 'flex', justifyContent: 'center', alignItems: 'center' };

    if (loading) {
        return (
            <div style={centerStyle}>
                <Spin size="large" tip="Loading map data..." />
            </div>
        );
    }

    return (
        <div style={{ height: mapHeight, width: '100%', display: 'flex' }}>
            {/* Map Section */}
            <div style={{ flex: 1, height: '100%', position: 'relative', transition: 'width 0.3s ease' }}>
                <Card
                    styles={{
                        body: {
                            padding: 0,
                            height: '100%',
                        },
                    }}
                    style={{ height: '100%' }}
                >
                    <Button
                        icon={isPanelVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                        onClick={() => setPanelVisible(!isPanelVisible)}
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 1000, // Ensure it's above the map tiles
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderColor: '#ccc'
                        }}
                    />
                    <DynamicMap
                        center={location ? [location.lat, location.lng] : undefined}
                        zoom={location ? 13 : 6}
                        layers={layers}
                        geoObjects={geoObjects}
                        visibleLayerIds={visibleLayerIds}
                        onSelectObject={handleSelectObject}
                    />
                </Card>
            </div>

            {/* Controls & Details Panel */}
            <div style={{
                width: isPanelVisible ? '350px' : '0px',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                height: '100%',
                backgroundColor: '#f0f2f5'
            }}>
                <Card title="Controls & Details" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                    {panelMode === 'details' && (
                        <>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => { setPanelMode('create'); setPanelVisible(true); }}
                                style={{ width: '100%', marginBottom: 16 }}
                            >
                                Create New Data
                            </Button>
                            <LayerControl
                                layers={layers}
                                visibleLayerIds={visibleLayerIds}
                                onVisibilityChange={handleVisibilityChange}
                            />
                            <div id="detail-section" style={{ marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0 }}>Details</h4>
                                    {selectedObject && panelMode === 'details' && (
                                        <Button size="small" onClick={() => setPanelMode('edit')}>Edit</Button>
                                    )}
                                </div>

                                <ObjectDetailCard
                                    object={selectedObject}
                                    layer={layers.find(l => l._id === selectedObject?.layerId)}
                                />
                            </div>
                        </>
                    )}

                    {(panelMode === 'create' || panelMode === 'edit') && (
                        <GeoObjectForm
                            key={selectedObject?._id || 'create'} // Re-mount form on new selection
                            initialData={panelMode === 'edit' ? selectedObject : null}
                            layers={layers}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setPanelMode('details')}
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
