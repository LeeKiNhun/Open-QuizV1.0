// src/pages/ExamPages/OpenQuizFolderPage.jsx
import React, { useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { folderNameFromId } from "./OpenQuizmap";
import Breadcrumb from "../../components/common/BreadCrumb";
import { useClipboard } from "../../context/ClipboardContext";
import "./OpenQuizFolderPage.css";

export default function OpenQuizFolderPage() {
  const { folderId } = useParams();
  const location = useLocation();
  const [q, setQ] = useState("");
  const { clipboard, clearClipboard } = useClipboard();

  const segments = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("kho-de-openquiz");
    if (idx === -1) return [];
    return parts.slice(idx + 1);
  }, [location.pathname]);

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

  // 🔥 50 ĐỀ GIẢ
  const mockExams = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => ({
        id: i + 1,
        name: `Đề thi thử THPT 2025 – Địa Lí (Mã ${100 + i})`,
        viewUrl: "/openquiz/de-1.html",
      })),
    []
  );

  // 🔎 SEARCH TẠM THỜI
  const filteredExams = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mockExams;
    return mockExams.filter((e) =>
      e.name.toLowerCase().includes(s)
    );
  }, [q, mockExams]);

  return (
    <div className="oqf-page">
      <Breadcrumb items={crumbs} />

      <div className="oqf-top">
        <div className="oqf-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm"
          />
          <span className="oqf-search-icon" aria-hidden="true">
            🔍
          </span>
        </div>
      </div>

      <div className="oqf-card">
        <table className="oqf-table">
          <thead>
            <tr>
              <th className="c-check"></th>
              <th className="c-name">Tên</th>
              <th className="c-actions"></th>
            </tr>
          </thead>

          <tbody>
            {filteredExams.map((exam) => (
              <tr key={exam.id} className="oqf-row">
                <td className="c-check"></td>

                <td className="c-name">
                  <div className="oqf-name">
                    <span className="oqf-file" aria-hidden="true">
                      📄
                    </span>
                    <span
                      className="oqf-name-text"
                      style={{ fontWeight: 600 }}
                    >
                      {exam.name}
                    </span>
                  </div>
                </td>

                <td className="c-actions">
                  <div className="oqf-actions">
                    <button
                      type="button"
                      className="btn-outline-green"
                      onClick={() =>
                        window.open(exam.viewUrl, "_blank")
                      }
                    >
                      Xem đề
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredExams.length === 0 && (
              <tr>
                <td colSpan={3} className="oqf-empty">
                  Không có kết quả phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="oqf-footer">
        {filteredExams.length} File
      </div>
    </div>
  );
}
