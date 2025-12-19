// src/pages/ExamPages/ExamPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/common/BreadCrumb";
import CreateFolderModal from "./CreateFolderModal";
import { useExamRepo } from "../../context/ExamRepoContext";
import { useClipboard } from "../../context/ClipboardContext";
import "./ExamPage.css";

export default function ExamPage() {
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const navigate = useNavigate();
  const { folders, addFolder, setFolders } = useExamRepo();
  const { clipboard, copyItems, cutItems, clearClipboard } = useClipboard();

  const rows = useMemo(() => {
    const openQuiz = {
      id: "openquiz-repo",
      name: "Kho đề OpenQuiz",
      tag: "OpenQuiz",
      type: "repo",
    };

    const userFolders = folders.map((f) => ({
      id: f.id,
      name: f.name,
      tag: "Thư mục",
      type: "folder",
    }));

    return [openQuiz, ...userFolders];
  }, [folders]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(s));
  }, [q, rows]);

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  };

  // ✅ XÓA folder được chọn
  const handleDelete = () => {
    const deletableIds = new Set(
      folders.filter((f) => selectedIds.has(f.id)).map((f) => f.id)
    );

    if (deletableIds.size === 0) {
      alert("Không có thư mục nào để xóa!");
      return;
    }

    if (!window.confirm(`Xóa ${deletableIds.size} thư mục đã chọn?`)) return;

    setFolders((prev) => prev.filter((f) => !deletableIds.has(f.id)));
    setSelectedIds(new Set());
    clearClipboard();
  };

  // ✅ COPY
  const handleCopy = () => {
    const items = filtered
      .filter((r) => selectedIds.has(r.id) && r.type === "folder")
      .map((r) => ({ id: r.id, name: r.name, type: r.type }));

    if (items.length === 0) {
      alert("Chọn ít nhất 1 thư mục để sao chép!");
      return;
    }

    copyItems(items);
    alert(`Đã sao chép ${items.length} thư mục!`);
  };

  // ✅ CUT
  const handleCut = () => {
    const items = filtered
      .filter((r) => selectedIds.has(r.id) && r.type === "folder")
      .map((r) => ({ id: r.id, name: r.name, type: r.type }));

    if (items.length === 0) {
      alert("Chọn ít nhất 1 thư mục để cắt!");
      return;
    }

    cutItems(items);
    alert(`Đã cắt ${items.length} thư mục! Chọn vị trí rồi bấm Dán.`);
  };

  const handlePaste = () => {
    if (!clipboard?.items?.length) {
      alert("Không có gì để dán!");
      return;
    }

    const now = Date.now();

    if (clipboard.mode === "copy") {
      const newFolders = clipboard.items.map((it, idx) => ({
        id: `${it.id}-copy-${now}-${idx}`,
        name: `${it.name} - Copy`,
      }));

      setFolders((prev) => [...newFolders, ...prev]);
      alert(`Đã dán ${newFolders.length} thư mục (bản sao)!`);
    }

    if (clipboard.mode === "cut") {
      const cutIds = new Set(clipboard.items.map((it) => it.id));

      setFolders((prev) => {
        const remaining = prev.filter((f) => !cutIds.has(f.id));
        return [...clipboard.items, ...remaining];
      });

      alert(`Đã di chuyển ${clipboard.items.length} thư mục!`);
    }

    clearClipboard();
    setSelectedIds(new Set());
  };

  const goCreateExam = () => navigate("/dethi/tao");
  const goRepo = () => navigate("/kho-de-openquiz");
  const stopRowClick = (e) => e.stopPropagation();

  return (
    <div className="exam-page">
      <Breadcrumb items={[{ label: "Tất cả", to: "/dethi" }]} />

      <div className="exam-top">
        <div className="exam-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm"
          />
          <span className="exam-search-icon">🔍</span>
        </div>

        <div className="exam-actions">
          <button className="exam-btn exam-btn-ghost" onClick={() => navigate("/nganhang")}>
            🏛 Tạo đề từ ngân hàng chung
          </button>
          <button className="exam-btn exam-btn-primary" onClick={() => navigate("/dethi/tao-thu-muc-nhanh")}>
            ☰ Tạo nhanh thư mục
          </button>
          <button className="exam-btn exam-btn-green" onClick={goCreateExam}>
            ＋ Tạo đề thi
          </button>
          <button className="exam-btn exam-btn-primary" onClick={() => setShowModal(true)}>
            ＋ Tạo thư mục
          </button>
        </div>
      </div>

      {hasSelection && (
        <div className="exam-selection-bar">
          <span>
            Đã chọn <strong>{selectedCount}</strong>
          </span>

          <div className="selection-buttons">
            <button onClick={handleCopy}>📋 Sao chép</button>
            <button onClick={handleCut}>✂️ Cắt</button>

            {clipboard?.items?.length > 0 && (
              <button onClick={handlePaste}>📌 Dán</button>
            )}

            <button onClick={handleDelete} className="danger">
              🗑️ Xóa
            </button>
          </div>
        </div>
      )}

      <div className="exam-card">
        <table className="exam-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="col-name">Tên</th>
              <th className="col-submitted">Số bài đã nộp</th>
              <th className="col-status">Trạng Thái</th>
              <th className="col-assigned">Đã Giao Cho</th>
              <th className="col-time">Thời gian thi</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`exam-row-click ${selectedIds.has(r.id) ? "row-selected" : ""}`}
                onClick={() => r.id === "openquiz-repo" && goRepo()}
                style={{ cursor: r.id === "openquiz-repo" ? "pointer" : "default" }}
              >
                <td className="col-check" onClick={stopRowClick}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                  />
                </td>

                <td className="col-name">
                  <div className="name-cell">
                    <span className="folder-icon">
                      {r.id === "openquiz-repo" ? "📁" : "📂"}
                    </span>
                    <span className="name-text">{r.name}</span>
                    {r.tag && <span className="tag-pill">{r.tag}</span>}
                  </div>
                </td>

                <td className="col-submitted">-</td>
                <td className="col-status">-</td>
                <td className="col-assigned">-</td>
                <td className="col-time">-</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  Không có kết quả phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="exam-footer">{rows.length} mục</div>

      <CreateFolderModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={(name) => addFolder(name, null)}
      />
    </div>
  );
}