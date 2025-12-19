// src/pages/ExamPages/OpenQuizRepoPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/common/BreadCrumb";
import SelectionToolbar from "../../components/common/SelectionToolbar";
import { useSelection } from "../../hooks/useSelection";
import { useOpenQuizRepo } from "../../context/OpenQuizRepoContext";
import "./OpenQuizRepoPage.css";

export default function OpenQuizRepoPage() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  
  const { customFolders, setCustomFolders } = useOpenQuizRepo();

  const baseRows = useMemo(
    () => [
      { id: "khoi-12", name: "Khối 12", type: "static" },
      { id: "khoi-11", name: "Khối 11", type: "static" },
      { id: "khoi-10", name: "Khối 10", type: "static" },
      { id: "thptqg", name: "Thi THPT Quốc Gia", type: "static" },
      { id: "khoi-9", name: "Khối 9", type: "static" },
      { id: "khoi-5", name: "Khối 5", type: "static" },
    ],
    []
  );


  const rows = useMemo(() => {
    const dynamic = (customFolders || []).map((f) => ({
      id: f.id,
      name: f.name,
      type: "folder",
    }));
    return [...baseRows, ...dynamic];
  }, [baseRows, customFolders]);

  // ✅ selection thao tác trên customFolders (không phải baseRows)
  const selection = useSelection(customFolders || [], setCustomFolders, {
    canDelete: () => true,
    canCut: () => true,
    onCopySuccess: (count) => alert(`Đã sao chép ${count} thư mục!`),
    onCutSuccess: (count) => alert(`Đã cắt ${count} thư mục!`),
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(s));
  }, [q, rows]);

  // ✅ chỉ folder dynamic mới chọn được
  const selectableInView = useMemo(
    () => filtered.filter((r) => r.type === "folder"),
    [filtered]
  );

  const allInViewSelected =
    selectableInView.length > 0 &&
    selectableInView.every((r) => selection.selectedIds.has(r.id));

  const goFolder = (id) => navigate(`/kho-de-openquiz/${id}`);
  const stopRowClick = (e) => e.stopPropagation();

  return (
    <div className="repo-page">
      <Breadcrumb
        items={[
          { label: "Tất cả", to: "/dethi" },
          { label: "Kho đề OpenQuiz", to: "/kho-de-openquiz" },
        ]}
      />

      <div className="repo-top">
        <div className="repo-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm"
          />
          <span className="repo-search-icon" aria-hidden="true">
            🔍
          </span>
        </div>

        <button className="repo-download-all" type="button">
          Tải xuống toàn bộ
        </button>
      </div>

      {/* ✅ toolbar chỉ hiện khi có chọn (folder custom) */}
      {selection.hasSelection && (
        <SelectionToolbar
          selectedCount={selection.selectedCount}
          clipboard={selection.clipboard}
          onCopy={selection.handleCopy}
          onCut={selection.handleCut}
          onPaste={selection.handlePaste}
          onDelete={selection.handleDelete}
        />
      )}

      <div className="repo-card">
        <table className="repo-table">
          <thead>
            <tr>
              <th className="c-check">
                <input
                  type="checkbox"
                  checked={allInViewSelected}
                  onChange={() => selection.toggleSelectAll(selectableInView)}
                  disabled={selectableInView.length === 0}
                />
              </th>
              <th className="c-name">
                Tên <span className="sort">⌃⌄</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const isFolder = r.type === "folder";
              const checked = isFolder && selection.selectedIds.has(r.id);

              return (
                <tr
                  key={r.id}
                  className={`repo-row repo-row-click ${
                    checked ? "row-selected" : ""
                  }`}
                  onClick={() => goFolder(r.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goFolder(r.id);
                    }
                  }}
                >
              <td className="c-check" onClick={stopRowClick}>
              <input
                type="checkbox"
                disabled={false}
                checked={selection.selectedIds.has(r.id)}
                onChange={() => selection.toggleSelect(r.id)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
/>
            </td>
                  <td className="c-name">
                    <div className="repo-name">
                      <span className="repo-folder" aria-hidden="true">
                        {r.type === "static" ? "📁" : "📂"}
                      </span>
                      <span className="repo-name-text">{r.name}</span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="repo-empty">
                  Không có kết quả phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="repo-footer">{filtered.length} File</div>
    </div>
  );
}
