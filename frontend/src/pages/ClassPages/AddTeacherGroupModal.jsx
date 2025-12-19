import React, { useEffect, useState } from "react";
import "./AddTeacherGroupModal.css";

export default function AddTeacherGroupModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setErr("");
  }, [open]);

  if (!open) return null;

  const close = () => onClose?.();

  const save = () => {
    const v = name.trim();
    if (!v) {
      setErr("Vui lòng nhập tên nhóm.");
      return;
    }
    const rs = onCreate?.(v);
    if (rs?.ok) close();
  };

  return (
    <div className="tgm-overlay" onMouseDown={close}>
      <div className="tgm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tgm-head">Thêm nhóm giáo viên</div>

        <div className="tgm-body">
          <input
            className="tgm-input"
            placeholder="Tên nhóm"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr("");
            }}
          />
          {err && <div className="tgm-err">{err}</div>}
        </div>

        <div className="tgm-foot">
          <button type="button" className="tgm-btn ghost" onClick={close}>
            Hủy
          </button>
          <button type="button" className="tgm-btn primary" onClick={save}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
