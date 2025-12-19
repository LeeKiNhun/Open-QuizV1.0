import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import UserDashboardPage from "./pages/user/UserDashboardPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token || token === "undefined") return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthLayout isRegister={false} />} />
        <Route path="/register" element={<AuthLayout isRegister={true} />} />

        <Route
          path="/home"
          element={
            <RequireAuth>
              <MainLayout currentUser={currentUser} title="Màn hình chính">
                <UserDashboardPage />
              </MainLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/user/dashboard"
          element={
            <RequireAuth>
              <MainLayout currentUser={currentUser} title="Dashboard">
                <UserDashboardPage />
              </MainLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth>
              <MainLayout currentUser={currentUser} title="Admin">
                <AdminDashboardPage />
              </MainLayout>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
