// src/components/RoleSwitcher.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import "./RoleSwitcher.css";

export default function RoleSwitcher() {
  const { role, switchToTeacher, switchToStudent } = useRole();
  const navigate = useNavigate();

  const handleTeacherClick = () => {
    if (role === "teacher") return;
    
    switchToTeacher();
    navigate("/home", { replace: true });
  };

  const handleStudentClick = () => {
    // ✅ Mở tab mới với trang học sinh
    window.open("/student", "_blank");
  };

  return (
    <div className="role-switcher">
      <button 
        className={`role-btn ${role === "teacher" ? "active" : ""}`}
        onClick={handleTeacherClick}
        title="Chế độ giáo viên"
      >
        👨‍🏫 Giáo viên
      </button>
      <button 
        className="role-btn"
        onClick={handleStudentClick}
        title="Mở trang học sinh (tab mới)"
      >
        🎓 Học sinh
      </button>
    </div>
  );
}