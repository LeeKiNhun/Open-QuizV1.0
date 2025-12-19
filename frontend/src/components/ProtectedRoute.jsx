// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";

export default function ProtectedRoute({ 
  children, 
  currentUser, 
  requireTeacher = false 
}) {
  const { isTeacher, switchToTeacher } = useRole();
  const navigate = useNavigate();

  // ✅ Kiểm tra đăng nhập
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Kiểm tra quyền teacher
  if (requireTeacher && !isTeacher) {
    return (
      <div style={{ 
        padding: "40px 20px", 
        textAlign: "center",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}>
        <div style={{ 
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          maxWidth: "500px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
          <h2 style={{ marginBottom: 8, color: "#1f2937", fontSize: 24 }}>
            Chỉ giáo viên mới có quyền truy cập
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
            Vui lòng chuyển sang chế độ Giáo viên để sử dụng tính năng này
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {/* ✅ Nút chuyển sang Teacher */}
            <button
              onClick={() => {
                switchToTeacher();
                // Reload để re-render
                window.location.reload();
              }}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 15,
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
              }}
            >
              👨‍🏫 Chuyển sang Giáo viên
            </button>

            {/* ✅ Nút về trang chủ */}
            <button
              onClick={() => navigate("/", { replace: true })}
              style={{
                padding: "12px 24px",
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 15
              }}
            >
              ← Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}