// src/pages/TeacherPages/AddTeacherGroupModal.jsx
import React, { useEffect, useState } from "react";
import "./AddTeacherGroupModal.css";

export default function AddTeacherGroupModal({ open, onClose, onCreate, editingGroup = null }) {
  const [name, setName] = useState("");
  const [showErr, setShowErr] = useState(false);
    
  
  const isEdit = !!editingGroup?.id;

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      setName(editingGroup.name || "");
    } else {
      setName("");
    }
    setShowErr(false);
  }, [open, isEdit, editingGroup?.id]);

  if (!open) return null;

  const close = () => {
    onClose?.();
  };

  const onConfirm = () => {
    if (!name.trim()) {
      setShowErr(true);
      return;
    }

    const result = onCreate?.(name.trim());
    if (result?.ok) close();
  };

  return (
    <div className="atgm-overlay" onMouseDown={close}>
      <div className="atgm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="atgm-head">{isEdit ? "Sửa nhóm giáo viên" : "Thêm nhóm giáo viên"}</div>

        <div className="atgm-body">
          <input
            className="atgm-input"
            placeholder="Nhập tên nhóm (VD: Tổ Toán - Lý, Khối 12...)"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowErr(false);
            }}
            autoFocus
          />
          {showErr && <div className="atgm-err">Vui lòng nhập tên nhóm.</div>}
        </div>

        <div className="atgm-footer">
          <button className="atgm-btn atgm-cancel" type="button" onClick={close}>
            Hủy
          </button>
          <button className="atgm-btn atgm-ok" type="button" onClick={onConfirm}>
            {isEdit ? "Lưu thay đổi" : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
}