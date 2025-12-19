// src/components/layout/Topbar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRole } from "../../context/RoleContext";
import RoleSwitcher from "../RoleSwitcher";
import vn_icon from "../../assets/vn.png";
import bell_icon from "../../assets/bell.png";
import "./Topbar.css";

export default function Topbar({ title, currentUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTeacher } = useRole();

  // Kiểm tra đăng nhập
  const isLoggedIn = !!currentUser;
  const name = currentUser?.hoTen || "Giáo viên";
  const role = currentUser?.vaiTro || "Giáo viên";
  const avatarChar = (name?.charAt(0) || "G").toUpperCase();

  // Logic nút "Quay lại" - ẩn ở trang học sinh làm bài
  const hideBackPrefixes = ["/home", "/login", "/register", "/lam-bai"];
  const showBack = !hideBackPrefixes.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  const getModuleRoot = () => {
    const seg = location.pathname.split("/").filter(Boolean)[0];
    return seg ? `/${seg}` : "/";
  };

  const handleBack = () => {
    const moduleRoot = getModuleRoot();

    // Nếu đang ở trang con -> về trang chính module
    if (location.pathname !== moduleRoot) {
      navigate(moduleRoot, { replace: true });
      return;
    }

    // Nếu đang ở trang chính module -> về Home
    navigate("/home", { replace: true });
  };

  // Xử lý đăng xuất
  const handleLogoutClick = () => {
    if (typeof onLogout === "function") {
      onLogout();
    }

    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");

    navigate("/login", { replace: true });
    window.location.reload();
  };

  return (
    <header
      style={{
        height: "70px",
        background: "#ffffff",
        borderRadius: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
        marginBottom: "24px",
      }}
    >
      {/* LEFT - NÚT QUAY LẠI */}
      <div style={{ width: "200px", display: "flex", alignItems: "center" }}>
        {showBack && (
          <button
            type="button"
            className="topbar-back-btn"
            onClick={handleBack}
            title="Quay lại"
          >
            <span className="topbar-back-icon">‹</span>
            <span className="topbar-back-text">Quay lại</span>
          </button>
        )}
      </div>

      {/* CENTER - TITLE */}
      <div
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: "18px",
          fontWeight: 600,
          color: "#1f2933",
        }}
      >
        {title}
      </div>

      {/* RIGHT - ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* ✅ Role Switcher - Hiển thị khi đã đăng nhập */}
        {isLoggedIn && <RoleSwitcher />}

        {/* Cờ VN */}
        <div
          style={{
            width: "30px",
            height: "20px",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid rgba(148,163,184,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img
            src={vn_icon}
            alt="VN"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Chuông thông báo - Chỉ hiện khi đã đăng nhập */}
        {isLoggedIn && (
          <button
            type="button"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.6)",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title="Thông báo"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "rgba(148,163,184,0.6)";
            }}
          >
            <img
              src={bell_icon}
              alt="bell"
              style={{ width: "18px", height: "18px" }}
            />
          </button>
        )}

        {/* ===== CHƯA ĐĂNG NHẬP ===== */}
        {!isLoggedIn && (
          <>
            <button
              type="button"
              style={{
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#45a049";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4CAF50";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Đăng Nhập
            </button>

            <button
              type="button"
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/register")}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1976D2";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2196F3";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Đăng Ký
            </button>
          </>
        )}

        {/* ===== ĐÃ ĐĂNG NHẬP ===== */}
        {isLoggedIn && (
          <>
            {/* User Avatar & Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginLeft: 6,
                padding: "6px 10px",
                borderRadius: 999,
                background: "#f8fafc",
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  background:
                    "radial-gradient(circle at 0 0, #ffecd5, #f97373, #2563eb)",
                  fontSize: "16px",
                }}
              >
                {avatarChar}
              </div>

              <div style={{ lineHeight: 1.1, textAlign: "left" }}>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#1f2937" }}>
                  {name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, color: "#64748b" }}>
                  {role}
                </div>
              </div>
            </div>

            {/* Nút Đăng xuất */}
            <button
              type="button"
              onClick={handleLogoutClick}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc2626";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ef4444";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Đăng xuất
            </button>
          </>
        )}
      </div>
    </header>
  );
}