// src/components/common/SelectionToolbar.jsx
import React from "react";
import "./SelectionToolbar.css";

export default function SelectionToolbar({
  selectedCount,
  clipboard,
  onCopy,
  onCut,
  onPaste,
  onDelete,
}) {
  return (
    <div className="selection-toolbar">
      <span>
        Đã chọn <strong>{selectedCount}</strong>
      </span>

      <div className="toolbar-buttons">
        <button onClick={onCopy}>📋 Sao chép</button>
        <button onClick={onCut}>✂️ Cắt</button>

        {clipboard?.items?.length > 0 && (
          <button onClick={onPaste}>📌 Dán</button>
        )}

        <button onClick={onDelete} className="danger">
          🗑️ Xóa
        </button>
      </div>
    </div>
  );
}