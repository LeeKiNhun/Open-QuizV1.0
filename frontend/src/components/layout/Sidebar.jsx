// src/components/layout/Sidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import homeIcon from "../../assets/home.png";
import examIcon from "../../assets/document.png";
import dethiIcon from "../../assets/folder.png";
import teacherIcon from "../../assets/teacher.png";
import bookIcon from "../../assets/book.png";
import bankIcon from "../../assets/bank.png";
import classIcon from "../../assets/layer.png";
import settingsIcon from "../../assets/setting.png";

const menuItems = [
  { icon: homeIcon, to: "/home" },
  { icon: examIcon, to: "/baitap" },
  { icon: dethiIcon, to: "/dethi" },
  { icon: classIcon, to: "/lop" },
  { icon: teacherIcon, to: "/gv" },
  { icon: bookIcon, to: "/tailieu" },
  { icon: bankIcon, to: "/nganhang" },
];

export default function Sidebar({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const name = currentUser?.hoTen || "Giáo viên";
  const avatarChar = name.charAt(0).toUpperCase();

  const isActivePath = (to) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <aside
      style={{
        width: "88px",
        background: "#0b4dba",
        borderTopRightRadius: "32px",
        borderBottomRightRadius: "32px",
        paddingTop: "20px",
        paddingBottom: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        boxShadow: "2px 0 8px rgba(15,23,42,0.35)",
        overflow: "hidden",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "999px",
          border: "3px solid #fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 0 0, #ffecd5, #f97373, #2563eb)",
          color: "white",
          fontWeight: 700,
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        {avatarChar}
      </div>

      {/* MENU ICONS */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          alignItems: "center",
          flex: 1,
          width: "100%",
          padding: "0 0 12px 0",
        }}
      >
        {menuItems.map((item, index) => {
          const active = isActivePath(item.to);

          return (
            <button
              key={index}
              onClick={() => navigate(item.to)}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "999px",
                border: active
                  ? "3px solid #ffffff"
                  : "3px solid transparent",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: active
                  ? "0 0 0 4px rgba(255,255,255,0.25)"
                  : "none",
                transition: "all 0.18s ease",
              }}
              title={item.to}
            >
              <img
                src={item.icon}
                alt="menu-icon"
                style={{
                  width: "22px",
                  height: "22px",
                  filter: "brightness(0) invert(1)", // icon luôn trắng
                }}
              />
            </button>
          );
        })}
      </nav>

      {/* SETTINGS */}
      <button
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "16px",
          border: "none",
          background: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          marginTop: "8px",
          flexShrink: 0,
        }}
        onClick={() => navigate("/settings")} // ✅ nếu chưa có route thì có thể bỏ dòng này
        title="Cài đặt"
      >
        <img
          src={settingsIcon}
          alt="settings"
          style={{ width: "20px", height: "20px", filter: "invert(1)" }}
        />
      </button>
    </aside>
  );
}
