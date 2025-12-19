// src/pages/ExamPages/OpenQuizFolderPage.jsx
import React, { useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { folderNameFromId } from "./OpenQuizmap"; // nhớ đúng tên file
import Breadcrumb from "../../components/common/BreadCrumb";
import { useClipboard } from "../../context/ClipboardContext";
import "./OpenQuizFolderPage.css";

export default function OpenQuizFolderPage() {
  const { folderId } = useParams();
  const location = useLocation();
  const [q, setQ] = useState("");
  const { clipboard, clearClipboard } = useClipboard();// nút dán

  const segments = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("kho-de-openquiz");
    if (idx === -1) return [];
    return parts.slice(idx + 1);
  }, [location.pathname]);
  const handlePaste = () => {
  if (!clipboard) return;

  if (clipboard.mode === "copy") {
    // clone items → thêm vào folder hiện tại
  }

  if (clipboard.mode === "cut") {
    // di chuyển items → xoá khỏi folder cũ
  }

  clearClipboard();
};

  const crumbs = useMemo(() => {
    const base = [
      { label: "Tất cả", to: "/dethi" },
      { label: "Kho đề OpenQuiz", to: "/kho-de-openquiz" },
    ];

    const extra = segments.map((seg, i) => ({
      label: folderNameFromId?.(seg) || seg,
      to: "/kho-de-openquiz/" + segments.slice(0, i + 1).join("/"),
    }));

    return [...base, ...extra];
  }, [segments]);

  const folderName = useMemo(() => {
    return folderNameFromId?.(folderId) || folderId || "Thư mục";
  }, [folderId]);

  const rows = useMemo(
    () => [
      {
        id: 1,
        name:
          "Sở Giáo Dục Ninh Bình - Lần 1 (Thi thử Tốt Nghiệp THPT 2025 môn Địa Lí)",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(s));
  }, [q, rows]);

  const onView = (row) => alert("Mở xem nội dung đề: " + row.name);
  const onDownload = (row) => alert("Tải xuống: " + row.name);

  return (
    <div className="oqf-page">
      {/* BREADCRUMB dùng chung, CSS không đổi khi qua folder */}
      <Breadcrumb items={crumbs} />
      
       <div className="oqf-top">
        <div className="oqf-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm"
          />
          <span className="oqf-search-icon" aria-hidden="true">🔍</span>
        </div>

        <button className="oqf-download-all" type="button">
          Tải xuống toàn bộ
        </button>
      </div>
      <div className="oqf-card">
        <table className="oqf-table">
          <thead>
            <tr>
              <th className="c-check"><input type="checkbox" /></th>
              <th className="c-name">Tên</th>
              <th className="c-actions" />
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="oqf-row">
                <td className="c-check"><input type="checkbox" /></td>
                <td className="c-name">
                  <div className="oqf-name">
                    <span className="oqf-file" aria-hidden="true">📄</span>
                    <span className="oqf-name-text">{r.name}</span>
                  </div>
                </td>
                <td className="c-actions">
                  <div className="oqf-actions">
                    <button type="button" className="btn-outline-green" onClick={() => onView(r)}>
                      Xem nội dung đề
                    </button>
                    <button type="button" className="btn-blue" onClick={() => onDownload(r)}>
                      Tải xuống
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="oqf-empty">Không có kết quả phù hợp</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="oqf-footer">{filtered.length} File</div>
    </div>
  );
}