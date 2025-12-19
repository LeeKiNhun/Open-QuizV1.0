// src/context/ExamRepoContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ExamRepoContext = createContext(null);
const STORAGE_KEY = "openquiz_repo_folders";

export function ExamRepoProvider({ children }) {
  const [folders, setFolders] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  const addFolder = (name, parentId = null) => {
    const clean = (name || "").trim();
    if (!clean) return { ok: false, message: "Vui lòng nhập tên thư mục" };

    const slug = clean
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
      .replace(/\-+/g, "-")
      .replace(/^\-|\-$/g, "");

    const id = `${slug || "folder"}-${Date.now()}`;
    const newFolder = { id, name: clean, parentId };

    setFolders((prev) => [newFolder, ...prev]);
    return { ok: true, folder: newFolder };
  };

  // ✅ QUAN TRỌNG: export setFolders
  const value = useMemo(
    () => ({ folders, addFolder, setFolders }),
    [folders]
  );

  return (
    <ExamRepoContext.Provider value={value}>
      {children}
    </ExamRepoContext.Provider>
  );
}

export function useExamRepo() {
  const ctx = useContext(ExamRepoContext);
  if (!ctx) throw new Error("useExamRepo must be used within ExamRepoProvider");
  return ctx;
}