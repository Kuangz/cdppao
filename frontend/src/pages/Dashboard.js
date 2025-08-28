import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Spin, message, Button, Space } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined } from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
import { getLayers } from '../api/layer';
import { getGeoObjectsByLayer } from '../api/geoObject';
import { Image } from 'antd';
import DynamicMap from '../components/Map/DynamicMap';
import LayerControl from '../components/LayerControl';
import useCurrentLocation from '../hooks/useCurrentLocation';
import useResponsiveMapHeight from '../hooks/useResponsiveMapHeight';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Dashboard = () => {
    const [layers, setLayers] = useState([]);
    const [geoObjects, setGeoObjects] = useState({}); // { layerId: [objects] }
    const [visibleLayerIds, setVisibleLayerIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState(null);

    const navigate = useNavigate();
    const { location } = useCurrentLocation(true);
    const mapHeight = useResponsiveMapHeight(600, 400);

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
         setTimeout(() => {
            document.getElementById("detail-section")?.scrollIntoView({ behavior: "smooth" });
        }, 200);
    }, []);

    const handleVisibilityChange = (newVisibleIds) => {
        setVisibleLayerIds(newVisibleIds);
    };

    const centerStyle = { textAlign: "center", padding: 64, height: mapHeight, display: 'flex', justifyContent: 'center', alignItems: 'center' };

    if (loading) {
        return (
            <div style={centerStyle}>
                <Spin size="large" tip="Loading map data..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1400, margin: 'auto', padding: '16px 4px' }}>
            <Row gutter={[16, 16]}>
                {/* Map Section */}
                <Col xs={24} md={18}>
                    <Card
                        styles={{
                            body: {
                                padding: 0,
                                position: "relative",
                                height: mapHeight,
                            },
                        }}
                    >
                        <DynamicMap
                            center={location ? [location.lat, location.lng] : undefined}
                            zoom={location ? 13 : 6}
                            layers={layers}
                            geoObjects={geoObjects}
                            visibleLayerIds={visibleLayerIds}
                            onSelectObject={handleSelectObject}
                        />
                    </Card>
                </Col>

                {/* Controls & Details Section */}
                <Col xs={24} md={6}>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate('/geodata/new')}
                                style={{ width: '100%', marginBottom: 16 }}
                            >
                                Add Data to Layer
                            </Button>
                           <LayerControl
                                layers={layers}
                                visibleLayerIds={visibleLayerIds}
                                onVisibilityChange={handleVisibilityChange}
                           />
                        </Col>

                        <Col span={24}>
                            <Card title="Details" id="detail-section">
                                {selectedObject ? (
                                    <div>
                                        <h4>{selectedObject.properties.name || 'Selected Object'}</h4>
                                        {selectedObject.images && selectedObject.images.length > 0 && (
                                            <Image.PreviewGroup>
                                                <Space wrap>
                                                    {selectedObject.images.map((img, index) => (
                                                        <Image key={index} width={80} src={`${SERVER_URL}/${img}`} />
                                                    ))}
                                                </Space>
                                            </Image.PreviewGroup>
                                        )}
                                        <pre style={{ maxHeight: 300, overflow: 'auto', marginTop: 16 }}>
                                            {JSON.stringify(selectedObject.properties, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <p>Click on an object on the map to see its details.</p>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
