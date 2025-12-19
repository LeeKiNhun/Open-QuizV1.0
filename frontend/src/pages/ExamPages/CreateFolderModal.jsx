import React, { useRef, useState } from "react";
import "./CreateFolderModal.css";

export default function CreateFolderModal({ open, onClose, onCreate }) {
  const [tab, setTab] = useState("create"); // "create" | "excel"
  const [name, setName] = useState("");
  const fileRef = useRef(null);

  if (!open) return null;

  const close = () => {
    setName("");
    setTab("create");
    onClose?.();
  };

const onSave = () => {
  const v = name.trim();
  if (!v) return;

  const res = onCreate?.(v);

  // ✅ linh hoạt: nếu onCreate trả {ok:true} hoặc true hoặc undefined thì vẫn đóng
  if (res?.ok === true || res === true || res === undefined) close();
};


  const pickExcel = () => fileRef.current?.click();

  return (
    <div className="cfm-overlay" onMouseDown={close}>
      <div className="cfm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cfm-tabs">
          <button
            type="button"
            className={`cfm-tab ${tab === "create" ? "active" : ""}`}
            onClick={() => setTab("create")}
          >
            Tạo thư mục
          </button>

          <button
            type="button"
            className={`cfm-tab ${tab === "excel" ? "active" : ""}`}
            onClick={() => setTab("excel")}
          >
            Thêm nhanh bằng file excel
          </button>
        </div>

        <div className="cfm-body">
          {tab === "create" ? (
            <div className="cfm-form">
              <input
                className="cfm-input"
                placeholder="Hãy nhập tên thư mục"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          ) : (
            <div className="cfm-excel">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={() => {}}
              />

              <button type="button" className="cfm-drop" onClick={pickExcel}>
                📗 Kéo thả file Excel hoặc Click để chọn file
              </button>

              <button
                type="button"
                className="cfm-template"
                onClick={(e) => e.preventDefault()}
              >
                ☁️ Tải file biểu mẫu
              </button>
            </div>
          )}
        </div>

        <div className="cfm-footer">
          <button type="button" className="cfm-btn cfm-cancel" onClick={close}>
            Hủy
          </button>
          <button type="button" className="cfm-btn cfm-save" onClick={onSave}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
