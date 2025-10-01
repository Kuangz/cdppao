import React from 'react';
import { Row, Col, Card } from 'antd';
import * as FaIcons from 'react-icons/fa';

const icons = [
    'FaBeer', 'FaAddressBook', 'FaAddressCard', 'FaAdjust', 'FaAirFreshener', 'FaAlignCenter',
    'FaAlignJustify', 'FaAlignLeft', 'FaAlignRight', 'FaAllergies', 'FaAmbulance', 'FaAnchor',
    'FaAngleDoubleDown', 'FaAngleDoubleLeft', 'FaAngleDoubleRight', 'FaAngleDoubleUp', 'FaAngleDown',
    'FaAngleLeft', 'FaAngleRight', 'FaAngleUp', 'FaAnkh', 'FaAppleAlt', 'FaArchive', 'FaArchway',
    'FaArrowAltCircleDown', 'FaArrowAltCircleLeft', 'FaArrowAltCircleRight', 'FaArrowAltCircleUp',
    'FaArrowCircleDown', 'FaArrowCircleLeft', 'FaArrowCircleRight', 'FaArrowCircleUp', 'FaArrowDown',
    'FaArrowLeft', 'FaArrowRight', 'FaArrowUp', 'FaArrowsAlt', 'FaArrowsAltH', 'FaArrowsAltV',
    'FaAssistiveListeningSystems', 'FaAsterisk', 'FaAt', 'FaAtlas', 'FaAtom', 'FaAudioDescription',
    'FaAward', 'FaBaby', 'FaBabyCarriage', 'FaBackspace', 'FaBackward', 'FaBacon', 'FaBalanceScale',
    'FaBalanceScaleLeft', 'FaBalanceScaleRight', 'FaBan', 'FaBandAid', 'FaUniversity'
];

const IconPicker = ({ onSelect }) => {
    return (
        <Card style={{ width: 300 }}>
            <Row gutter={[16, 16]}>
                {icons.map(iconName => {
                    const IconComponent = FaIcons[iconName];
                    return (
                        <Col key={iconName} span={4}>
                            <div onClick={() => onSelect(iconName)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <IconComponent size={24} />
                            </div>
                        </Col>
                    );
                })}
            </Row>
        </Card>
    );
};

export default IconPicker;
