// src/pages/notfound.jsx
import React from 'react';
import { Result, Button, Typography, Space } from 'antd';
import { HomeOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 720, width: '100%' }}>
        <Result
          status="404"
          title="ไม่พบหน้าเพจ (404)"
          subTitle={
            <Typography.Paragraph style={{ marginTop: 8 }}>
              ระบบไม่พบเส้นทางที่คุณเข้าถึง:&nbsp;
              <Typography.Text code copyable>{pathname}</Typography.Text>
            </Typography.Paragraph>
          }
          extra={
            <Space wrap>
              <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
                กลับหน้าหลัก
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                ย้อนกลับ
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
                ลองโหลดใหม่
              </Button>
            </Space>
          }
        />
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
          หากปัญหายังเกิดขึ้น โปรดติดต่อผู้ดูแลระบบ
        </Typography.Paragraph>
      </div>
    </div>
  );
};

export default NotFound;
