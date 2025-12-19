import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateExam.css";

const ACCEPT_EXTS = [".pdf", ".docx", ".xlsx", ".txt", ".zip"];
const ACCEPT_ATTR = ACCEPT_EXTS.join(",");

export default function CreateExam() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const onPickFile = () => inputRef.current?.click();

  const resetInput = () => {
    // reset để chọn lại cùng 1 file vẫn trigger onChange
    if (inputRef.current) inputRef.current.value = "";
  };

  const isAllowedFile = (file) => {
    const name = (file?.name || "").toLowerCase();
    return ACCEPT_EXTS.some((ext) => name.endsWith(ext));
  };

  const handlePickedFile = (file) => {
    if (!file) return;

    if (!isAllowedFile(file)) {
      setError(
        "Chỉ chấp nhận các định dạng: PDF, Word, Excel, Text, ZIP. File không đúng định dạng sẽ không được tải lên."
      );
      setFileName("");
      resetInput();
      return;
    }

    setError("");
    setFileName(file.name);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    handlePickedFile(file);
  };

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e) => {
    prevent(e);
    const file = e.dataTransfer.files?.[0];
    handlePickedFile(file);
  };

  return (
    <div className="ce-page">
      <div className="ce-title-row">
        <h2 className="ce-title">Tạo đề mới</h2>
      </div>

      <div className="ce-grid">
        {/* LEFT: Upload */}
        <div
          className="ce-upload-card"
          onDragEnter={prevent}
          onDragOver={prevent}
          onDragLeave={prevent}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}              // ✅ lọc file trong hộp chọn
            onChange={onFileChange}
            style={{ display: "none" }}
          />

          <div className="ce-cloud" aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.7-1.5A3.5 3.5 0 1 1 18.5 18H7Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 12v7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M9.5 14.5 12 12l2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="ce-upload-head">Chọn File hoặc kéo thả File vào đây</div>

          <div className="ce-upload-sub">
            <b>Chỉ chấp nhận các định dạng:</b> PDF, Word, Excel, Text, ZIP
          </div>

          <div className="ce-upload-sub">
            File không đúng định dạng sẽ không được tải lên.
          </div>

          <button className="ce-pick-btn" onClick={onPickFile} type="button">
            Chọn file
          </button>

          <div className="ce-links">
            <a href="#!" onClick={(e) => e.preventDefault()}>
              Đề mẫu OpenQuiz Pdf
            </a>
            <span> | </span>
            <a href="#!" onClick={(e) => e.preventDefault()}>
              Đề mẫu OpenQuiz Docx
            </a>
            <span> | </span>
            <a href="#!" onClick={(e) => e.preventDefault()}>
              File Excel bảng đáp án đề Offline
            </a>
            <span> | </span>
            <a href="#!" onClick={(e) => e.preventDefault()}>
              File Text mẫu (.txt)
            </a>
            <span> | </span>
            <a href="#!" onClick={(e) => e.preventDefault()}>
              File Zip mẫu (.zip)
            </a>
          </div>

          {/* lỗi định dạng */}
          {error && (
            <div className="ce-file" style={{ color: "#ef4444" }}>
              {error}
            </div>
          )}

          {fileName && !error && (
            <div className="ce-file">
              File đã chọn: <b>{fileName}</b>
            </div>
          )}
        </div>

        {/* RIGHT: Options */}
        <div className="ce-right">
          <Section
            title="Online"
            items={[
              {
                title: "Tự soạn Đề thi / Bài tập",
                desc:
                  "Sử dụng trình soạn thảo của OpenQuiz để tạo Bài tập/Đề thi. Chỉnh sửa từ mẫu có sẵn hoặc Copy & Paste từ nguồn khác.",
                iconBg: "peach",
                icon: "✏️",
                badge: null,
              },
              {
                title: "Tạo đề thi tương tác",
                desc:
                  "Tạo đề thi, trò chơi học tập cho học sinh làm trực tiếp trên màn hình với hoạt động sinh động giúp trải nghiệm thú vị hơn.",
                iconBg: "gray",
                icon: "🎮",
                badge: "Mới",
              },
              {
                title: "Tạo đề thi đánh giá năng lực",
                desc:
                  "Tạo nhiều bộ đề đánh giá năng lực từ mẫu có sẵn của OpenQuiz. Giúp tối ưu hoá quy trình xây dựng đề thi.",
                iconBg: "blue",
                icon: "📋",
                badge: null,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="ce-section">
      <button
        className="ce-section-head"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ce-section-title">{title}</span>
        <span className={`ce-caret ${open ? "open" : ""}`}>⌃</span>
      </button>

      {open && (
        <div className="ce-section-body">
          {items.map((it, idx) => (
            <button className="ce-item" key={idx} type="button">
              <div className={`ce-ico ${it.iconBg}`}>
                <span>{it.icon}</span>
              </div>

              <div className="ce-item-content">
                <div className="ce-item-title">
                  {it.title}
                  {it.badge && <span className="ce-badge">{it.badge}</span>}
                </div>
                <div className="ce-item-desc">{it.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
