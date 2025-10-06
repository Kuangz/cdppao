// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ค่ามาตรฐานพอสำหรับโปรเจกต์ของคุณ (antd, leaflet, react-router)
export default defineConfig({
    plugins: [react()],
    build: { outDir: 'dist' }
});
