// src/context/RoleContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const RoleContext = createContext(null);

const STORAGE_ROLE = "openquiz_user_role";

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem(STORAGE_ROLE);
    return saved === "student" ? "student" : "teacher";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_ROLE, role);
  }, [role]);

  const switchToTeacher = () => setRole("teacher");
  const switchToStudent = () => setRole("student");
  const toggleRole = () => setRole(prev => prev === "teacher" ? "student" : "teacher");

  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  return (
    <RoleContext.Provider value={{ 
      role, 
      isTeacher, 
      isStudent,
      switchToTeacher, 
      switchToStudent,
      toggleRole
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}