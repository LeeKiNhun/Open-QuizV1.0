// src/layouts/MainLayout.jsx
import React from "react";
import "./MainLayout.css";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";


function MainLayout({ children, currentUser, title = "Màn hình chính" }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#e9f0fa",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <Sidebar currentUser={currentUser} />

      {/* RIGHT SIDE (TOPBAR + CONTENT) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px 24px",
        }}
      >
        {/* TOPBAR */}
        <Topbar title={title} currentUser={currentUser} />

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1,
            padding: "8px 4px 24px 4px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
