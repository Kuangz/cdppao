import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import LayerManagement from "./pages/LayerManagement";
import GeoObjectManagementPage from "./pages/GeoObjectManagementPage";
import GeoObjectCreatePage from "./pages/GeoObjectCreatePage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import "antd/dist/reset.css";
import BinPointList from "./pages/BinPointList";
import BinPointCreatePage from "./pages/BinPointCreatePage";
import BinPointEditPage from "./pages/BinPointEditPage";
import MainLayout from "./components/MainLayout";
import ChangePasswordForm from "./components/ChangePasswordForm";
import UserManagement from "./pages/UserManagement";

function App() {
  return (

    <MainLayout>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={
          <AdminRoute>
            <Register />
          </AdminRoute>
        } />
        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePasswordForm />
          </ProtectedRoute>
        } />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garbage-bins"
          element={
            <ProtectedRoute>
              <BinPointList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garbage-bins/new"
          element={
            <ProtectedRoute>
              <BinPointCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garbage-bins/:id/edit"
          element={
            <ProtectedRoute>
              <BinPointEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geodata/new"
          element={
            <ProtectedRoute>
              <GeoObjectCreatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/layers/:layerId/objects"
          element={
            <AdminRoute>
              <GeoObjectManagementPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/layers"
          element={
            <AdminRoute>
              <LayerManagement />
            </AdminRoute>
          }
        />

        <Route path="/user-management"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
export default App;
