import React, { useMemo, useState } from "react";
import "./SelectTeachersModal.css";

export default function SelectTeachersModal({
  open,
  onClose,
  teachers,
  pickedIds,
  onPick, // (teacherId) => void
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const arr = teachers || [];
    if (!s) return arr;
    return arr.filter((t) => {
      const bag = [t.fullName, t.phone, t.email].filter(Boolean).join(" ").toLowerCase();
      return bag.includes(s);
    });
  }, [q, teachers]);

  if (!open) return null;

  const close = () => {
    setQ("");
    onClose?.();
  };

  return (
    <div className="stm-overlay" onMouseDown={close}>
      <div className="stm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="stm-head">
          <div className="stm-title">Chọn giáo viên</div>
          <button className="stm-x" type="button" onClick={close}>✕</button>
        </div>

        <div className="stm-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, phone, email"
          />
          <span className="stm-ico">🔍</span>
        </div>

        <div className="stm-list">
          {filtered.map((t) => {
            const picked = (pickedIds || []).some((id) => String(id) === String(t.id));
            return (
              <button
                key={t.id}
                type="button"
                className={`stm-item ${picked ? "picked" : ""}`}
                onClick={() => onPick?.(t.id)}
              >
                <div className="stm-name">{t.fullName}</div>
                <div className="stm-sub">{t.email}</div>
                {picked && <div className="stm-tag">Đã thêm</div>}
              </button>
            );
          })}

          {filtered.length === 0 && <div className="stm-empty">Không có giáo viên</div>}
        </div>

        <div className="stm-foot">
          <button className="stm-btn" type="button" onClick={close}>
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
