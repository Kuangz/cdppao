import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import "antd/dist/reset.css";
import BinPointList from "./pages/BinPointList";
import BinPointCreatePage from "./pages/BinPointCreatePage";
import BinPointEditPage from "./pages/BinPointEditPage";
import MainLayout from "./components/MainLayout";

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
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
export default App;
