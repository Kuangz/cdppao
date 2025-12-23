import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Spin, Button, Form, Drawer, Grid, Tabs, Input, List, Skeleton, Empty, Typography, FloatButton, Modal } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined, EnvironmentOutlined, PlusOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';

import { getLayers } from '../api/layer';
import { getGeoObjectsByLayer, createGeoObject, updateGeoObject } from '../api/geoObject';
import DynamicMap from '../components/Map/DynamicMap';
import LayerControl from '../components/LayerControl';
import GeoObjectForm from '../components/GeoObjectForm';
import ObjectDetailCard from '../components/ObjectDetailCard';
import useCurrentLocation from '../hooks/useCurrentLocation';
import { useMessageApi } from '../contexts/MessageContext';

import './Dashboard.css';

const { TabPane } = Tabs;
const { Text } = Typography;

const Dashboard = () => {
    const [layers, setLayers] = useState([]);
    const [geoObjects, setGeoObjects] = useState({}); // { layerId: [objects] }
    const [visibleLayerIds, setVisibleLayerIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState(null);
    const [isPanelVisible, setPanelVisible] = useState(true);
    const [activeTab, setActiveTab] = useState('layers'); // 'layers', 'list', 'details'
    const [searchText, setSearchText] = useState('');
    const [panelMode, setPanelMode] = useState('view'); // 'view', 'create', 'edit'

    // For Create FAB
    const [isLayerSelectModalVisible, setLayerSelectModalVisible] = useState(false);

    // For Infinite Scroll
    const [displayedLimit, setDisplayedLimit] = useState(20);
    const scrollContainerRef = useRef(null);

    const [form] = Form.useForm();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const messageApi = useMessageApi();
    const { location } = useCurrentLocation(true);

    useEffect(() => {
        if (panelMode === 'edit' && selectedObject) {
            form.setFieldsValue(selectedObject);
        } else if (panelMode === 'create') {
            form.resetFields();
        }
    }, [panelMode, selectedObject, form]);

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
            messageApi.error("โหลดข้อมูลไม่สำเร็จ");
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSelectObject = useCallback((object) => {
        setSelectedObject(object);
        setActiveTab('details');
        setPanelMode('view');
        setPanelVisible(true);
        if (isMobile) {
            // On mobile, maybe fly to location? handled by map component usually, but we want to show drawer
        }
    }, [isMobile]);

    const handleCreateClick = () => {
        setLayerSelectModalVisible(true);
    };

    const handleLayerSelect = (layerId) => {
        setLayerSelectModalVisible(false);
        const layer = layers.find(l => l._id === layerId);
        if (layer) {
            setSelectedObject({ layerId: layer._id });
            setPanelMode('create');
            setActiveTab('details'); // Use 'details' tab area for form? Or 'create' specific?
            setPanelVisible(true);
            // Ensure 'layers' or 'list' isn't active if we want to show form. 
            // In renderPanelContent, 'create' mode overrides Tabs. So just need to set panelMode.
        }
    };


    const handleFormSubmit = async (values) => {
        const formData = new FormData();
        formData.append('layerId', values.layerId);
        formData.append('geometry', JSON.stringify(values.geometry));

        if (values.properties) {
            formData.append('properties', JSON.stringify(values.properties));
        }

        if (values.images && values.images.length > 0) {
            values.images.forEach(file => {
                if (file.originFileObj) {
                    formData.append('images', file.originFileObj);
                }
            });
        }

        try {
            if (panelMode === 'create') {
                await createGeoObject(formData);
                messageApi.success('สร้างสถานที่สำเร็จ!');
            } else if (panelMode === 'edit' && selectedObject) {
                await updateGeoObject(selectedObject._id, formData);
                messageApi.success('อัปเดตข้อมูลสำเร็จ!');
            }
            setActiveTab('details');
            setPanelMode('view');
            setSelectedObject(null); // Deselect or maybe keep selected? Let's deselect for now or select the new one if possible
            if (panelMode === 'edit') setSelectedObject(null); // Clear selection to force refresh or re-fetch

            loadData();
        } catch (error) {
            const errData = error.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ';
            messageApi.error(errData);
            console.error("Form submission error:", error);
        }
    };

    // Filter objects for the list view
    const filteredObjects = useMemo(() => {
        let allObjects = [];
        layers.forEach(layer => {
            if (visibleLayerIds.includes(layer._id) && geoObjects[layer._id]) {
                const threadObjects = geoObjects[layer._id].map(obj => ({ ...obj, _layerName: layer.name, _layerColor: layer.color }));
                allObjects = allObjects.concat(threadObjects);
            }
        });

        if (!searchText) return allObjects;

        const lowerSearch = searchText.toLowerCase();
        return allObjects.filter(obj => {
            const name = obj.properties?.name || obj.properties?.label || obj.properties?.title || '';
            const desc = obj.properties?.description || '';
            return name.toLowerCase().includes(lowerSearch) || desc.toLowerCase().includes(lowerSearch);
        });
    }, [layers, geoObjects, visibleLayerIds, searchText]);

    // Handle Infinite Scroll
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Check if scrolled to bottom (with some buffer)
        if (scrollHeight - scrollTop - clientHeight < 50) {
            if (displayedLimit < filteredObjects.length) {
                setDisplayedLimit(prev => prev + 20);
            }
        }
    };

    // Reset limit when filter changes
    useEffect(() => {
        setDisplayedLimit(20);
        // Also scroll to top if ref exists
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [searchText, activeTab]);

    const renderPanelContent = () => {
        if (loading) return <Skeleton active />;

        if (panelMode === 'create' || panelMode === 'edit') {
            return (
                <div className="tab-scroll-container">
                    <GeoObjectForm
                        form={form}
                        key={selectedObject?._id || 'create'}
                        initialValues={panelMode === 'edit' ? selectedObject : null}
                        layer={layers.find(l => l._id === selectedObject?.layerId)}
                        layers={layers}
                        onFinish={handleFormSubmit}
                        onCancel={() => {
                            setPanelMode('view');
                            if (panelMode === 'create') setActiveTab('layers');
                            else setActiveTab('details');
                        }}
                    />
                </div>
            );
        }

        // displayed objects for infinite scroll
        const displayedObjects = filteredObjects.slice(0, displayedLimit);

        return (
            <Tabs
                className="full-height-tabs"
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'layers',
                        label: 'ชั้นข้อมูล',
                        children: (
                            <div
                                className="tab-scroll-container"
                                onScroll={handleScroll}
                                ref={activeTab === 'layers' ? scrollContainerRef : null}
                            >
                                <Input
                                    placeholder="ค้นหาสถานที่..."
                                    prefix={<SearchOutlined />}
                                    value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                    style={{ marginBottom: 16 }}
                                    allowClear
                                />
                                {searchText ? (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={displayedObjects}
                                        renderItem={item => (
                                            <List.Item
                                                onClick={() => handleSelectObject(item)}
                                                className="list-item-hover"
                                                style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                                            >
                                                <List.Item.Meta
                                                    avatar={<EnvironmentOutlined style={{ color: item._layerColor || '#1890ff' }} />}
                                                    title={<Text strong>{item.properties?.name || 'ไม่มีชื่อ'}</Text>}
                                                    description={<Text type="secondary" style={{ fontSize: '12px' }}>{item._layerName}</Text>}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <LayerControl
                                        layers={layers}
                                        visibleLayerIds={visibleLayerIds}
                                        onVisibilityChange={setVisibleLayerIds}
                                        onCreateObject={(layerId) => {
                                            const layer = layers.find(l => l._id === layerId);
                                            if (layer) {
                                                setSelectedObject({ layerId: layer._id });
                                                setPanelMode('create');
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'list',
                        label: 'รายการ',
                        children: (
                            <div
                                className="tab-scroll-container"
                                onScroll={handleScroll}
                                ref={activeTab === 'list' ? scrollContainerRef : null}
                            >
                                <div style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#fff', paddingBottom: 8 }}>
                                    <Input
                                        placeholder="กรองรายการ..."
                                        prefix={<SearchOutlined />}
                                        value={searchText}
                                        onChange={e => setSearchText(e.target.value)}
                                        allowClear
                                    />
                                    <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                                        แสดง {displayedObjects.length} จาก {filteredObjects.length} รายการ
                                    </div>
                                </div>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={displayedObjects}
                                    renderItem={item => (
                                        <List.Item
                                            onClick={() => handleSelectObject(item)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                backgroundColor: selectedObject?._id === item._id ? '#e6f7ff' : 'transparent'
                                            }}
                                            className="list-item-hover"
                                        >
                                            <List.Item.Meta
                                                avatar={<EnvironmentOutlined style={{ color: item._layerColor || '#1890ff' }} />}
                                                title={item.properties?.name || 'ไม่มีชื่อ'}
                                                description={item._layerName}
                                            />
                                        </List.Item>
                                    )}
                                />
                                {displayedLimit < filteredObjects.length && (
                                    <div style={{ textAlign: 'center', padding: '10px' }}>
                                        <Spin size="small" /> กำลังโหลด...
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'details',
                        label: 'รายละเอียด',
                        disabled: !selectedObject,
                        children: (
                            <div className="tab-scroll-container">
                                {selectedObject ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                                            <Button
                                                type="link"
                                                icon={<ArrowLeftOutlined />}
                                                onClick={() => setActiveTab('layers')}
                                                style={{ paddingLeft: 0, fontWeight: 500, color: '#595959' }}
                                            >
                                                ย้อนกลับ
                                            </Button>
                                            <Button
                                                type="text"
                                                icon={<EditOutlined />}
                                                onClick={() => setPanelMode('edit')}
                                                style={{ color: '#1890ff', backgroundColor: '#e6f7ff' }}
                                            >
                                                แก้ไข
                                            </Button>
                                        </div>
                                        <ObjectDetailCard
                                            object={selectedObject}
                                            layer={layers.find(l => l._id === selectedObject?.layerId)}
                                        />
                                    </>
                                ) : (
                                    <Empty description="ยังไม่ได้เลือกสถานที่" />
                                )}
                            </div>
                        )
                    }
                ]}
            />
        );
    };

    // Full page height calculation - usually 100vh minus whatever navbar height, or just 100vh if intent is maximized.
    const mapHeight = 'calc(100vh - 80px)';

    return (
        <div className="dashboard-container" style={{ height: mapHeight }}>
            <DynamicMap
                center={location ? [location.lat, location.lng] : undefined}
                zoom={location ? 13 : 11}
                layers={layers}
                geoObjects={geoObjects}
                visibleLayerIds={visibleLayerIds}
                onSelectObject={handleSelectObject}
                selectedObject={selectedObject}
            />

            {/* Create FAB */}
            <FloatButton
                icon={<PlusOutlined />}
                type="primary"
                className="map-create-fab"
                onClick={handleCreateClick}
                tooltip="สร้างสถานที่ใหม่"
            />

            <Modal
                title="เลือกชั้นข้อมูล"
                visible={isLayerSelectModalVisible}
                onCancel={() => setLayerSelectModalVisible(false)}
                footer={null}
            >
                <List
                    dataSource={layers}
                    renderItem={layer => (
                        <List.Item onClick={() => handleLayerSelect(layer._id)} style={{ cursor: 'pointer' }}>
                            <List.Item.Meta
                                avatar={<EnvironmentOutlined style={{ color: layer.color }} />}
                                title={layer.name}
                            />
                            <Button type="link">เลือก</Button>
                        </List.Item>
                    )}
                />
            </Modal>

            {!isPanelVisible && (
                <Button
                    type="primary"
                    icon={<MenuUnfoldOutlined />}
                    onClick={() => setPanelVisible(true)}
                    className="map-toggle-panel-btn"
                />
            )}

            {/* Floating Panel (Desktop) / Drawer (Mobile) */}
            {isMobile ? (
                <Drawer
                    placement="bottom"
                    height="60vh"
                    visible={isPanelVisible}
                    onClose={() => setPanelVisible(false)}
                    className="dashboard-drawer"
                    title={panelMode === 'view' ? "การควบคุมแผนที่" : (panelMode === 'create' ? "สร้างสถานที่ใหม่" : "แก้ไขสถานที่")}
                >
                    {renderPanelContent()}
                </Drawer>
            ) : (
                <div className={`dashboard-floating-panel ${!isPanelVisible ? 'hidden' : ''}`}>
                    {/* Panel Header */}
                    <div className="dashboard-panel-header">
                        <img src="/logo_provincial.png" alt="logo" style={{ height: '40px', marginRight: '10px' }} />
                        <span className="dashboard-panel-title">CDP PAO</span>
                        <Button
                            type="text"
                            icon={<MenuFoldOutlined />}
                            onClick={() => setPanelVisible(false)}
                        />
                    </div>

                    {/* Panel Content - Flex Grow to take remaining space */}
                    <div className="dashboard-panel-content">
                        {renderPanelContent()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;