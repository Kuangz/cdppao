import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { EnvironmentOutlined, DeleteOutlined } from "@ant-design/icons";

export default function DashboardStats({ totalPoints, brokenCount }) {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} md={6}>
                <Card variant="borderless" hoverable>
                    <Statistic
                        title="จำนวนจุดติดตั้ง"
                        value={totalPoints}
                        prefix={<EnvironmentOutlined />}
                        valueStyle={{ color: "#1565c0" }}
                    />
                </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
                <Card variant="borderless" hoverable>
                    <Statistic
                        title="ถังที่แจ้งเสีย"
                        value={brokenCount}
                        prefix={<DeleteOutlined />}
                        valueStyle={{ color: brokenCount ? "#e53935" : "#388e3c" }}
                    />
                </Card>
            </Col>
        </Row>
    );
}
