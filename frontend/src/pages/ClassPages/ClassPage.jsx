// src/pages/ClassPages/ClassPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateClassModal from "./CreateClassModal";
import { useClassStore } from "../../context/ClassContext";
import "./ClassPage.css";

export default function ClassPage() {
  const navigate = useNavigate();
  const addRef = useRef(null);

  const { classes, addClass, updateClass, deleteClass, getGroupName } = useClassStore();

  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    const onDocDown = (e) => {
      if (!addRef.current) return;
      if (!addRef.current.contains(e.target)) setOpenAdd(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = classes || [];
    if (!s) return list;
    return list.filter((c) => String(c?.name || "").toLowerCase().includes(s));
  }, [q, classes]);

  const openCreateModal = () => {
    setEditingClass(null);
    setOpenModal(true);
    setOpenAdd(false);
  };

  const openEditModal = (klass) => {
    setEditingClass(klass);
    setOpenModal(true);
    setOpenAdd(false);
  };

  const closeModal = () => {
    setEditingClass(null);
    setOpenModal(false);
  };

  const handleCreateClass = (data) => {
    addClass({
      name: data?.name,
      schoolYear: data?.schoolYear,
      groupName: data?.groupName,
    });
    closeModal();
    return { ok: true };
  };

  const handleUpdateClass = (data) => {
    if (!editingClass?.id) return { ok: false };
    updateClass(editingClass.id, {
      name: data?.name,
      schoolYear: data?.schoolYear,
      groupName: data?.groupName,
    });
    closeModal();
    return { ok: true };
  };

  const handleDeleteClass = (id, name) => {
    if (window.confirm(`Xóa lớp "${name}"?`)) deleteClass(id);
  };

  const goDetail = (id) => navigate(`/lop/${id}`);

  return (
    <div className="class-page">
      <div className="class-header">
        <h2 className="class-title">Danh sách lớp</h2>

        <div className="class-actions">
          <div className="add-wrap" ref={addRef}>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setOpenAdd((v) => !v)}
            >
              ＋ Thêm
            </button>

            {openAdd && (
              <div className="add-menu" role="menu">
                <button type="button" className="add-item" onClick={openCreateModal}>
                  + Tạo lớp học
                </button>

                <button
                  className="add-item"
                  type="button"
                  onClick={() => {
                    setOpenAdd(false);
                    navigate("/lop/tao-khoa-moi");
                  }}
                >
                  ＋ Tạo lớp cho khóa mới
                </button>
              </div>
            )}
          </div>

          <button className="btn-outline" type="button">
            ⬇️ Tải danh sách lớp
          </button>
          <button className="btn-outline" type="button">
            💾 Lưu trữ
          </button>
        </div>
      </div>

      <div className="class-search-card">
        <input
          className="class-search-input"
          placeholder="Tìm kiếm theo tên lớp"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="class-search-icon">🔍</span>
      </div>

      {filtered.length === 0 ? (
        <div className="class-empty">Chưa có lớp nào</div>
      ) : (
        <div className="class-grid">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="class-card"
              onClick={() => goDetail(c.id)}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goDetail(c.id);
                }
              }}
            >
              <div className="class-card-header">
                <span className="class-card-icon">📖</span>
                <h3 className="class-card-name">{c.name}</h3>
              </div>

              <div className="class-card-body">
                <div className="class-card-row">
                  <span className="class-card-label">Năm học:</span>
                  <span className="class-card-value">{c.schoolYear || "-"}</span>
                </div>

                <div className="class-card-row">
                  <span className="class-card-label">Nhóm:</span>
                  <span className="class-card-value">{c.groupName || "Khác"}</span>
                </div>

                <div className="class-card-row">
                  <span className="class-card-label">Học sinh:</span>
                  <span className="class-card-value">{(c.students || []).length}</span>
                </div>
              </div>

              <div className="class-card-footer">
                <button
                  className="btn-card"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goDetail(c.id);
                  }}
                >
                  👁 Xem
                </button>

                <button
                  className="btn-card btn-card-edit"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(c);
                  }}
                >
                  ✏️ Sửa
                </button>

                <button
                  className="btn-card btn-card-delete"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClass(c.id, c.name);
                  }}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateClassModal
        open={openModal}
        onClose={closeModal}
        onCreate={handleCreateClass}
        onUpdate={handleUpdateClass}
        editingClass={editingClass}
      />
    </div>
  );
}
