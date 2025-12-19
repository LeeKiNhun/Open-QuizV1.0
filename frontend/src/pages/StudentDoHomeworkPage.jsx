
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHomeworkByShareCode } from "../api/homeworkApi";
import "./StudentDoHomeworkPage.css";

export default function StudentDoHomeworkPage() {
  const { shareCode } = useParams(); // ✅ Lấy shareCode từ URL
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [homework, setHomework] = useState(null);

  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHomework();
  }, [shareCode]);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const data = await getHomeworkByShareCode(shareCode);
      
      if (data && data.item) {
        setHomework(data.item);
      } else {
        setHomework(data); // dự phòng
      }
    } catch (err) {
      setError("Không tìm thấy bài tập");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentName.trim()) {
      alert("Vui lòng nhập họ tên");
      return;
    }

    if (!file) {
      alert("Vui lòng chọn file bài làm");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("studentName", studentName.trim());
      formData.append("studentClass", studentClass.trim());
      formData.append("file", file);
      formData.append("homeworkId", homework._id);

      // TODO: Gọi API submit
      // await submitHomework(formData);

      console.log("📤 Submitting:", {
        studentName: studentName.trim(),
        studentClass: studentClass.trim(),
        fileName: file.name,
        homeworkId: homework._id,
      });

      alert("✅ Nộp bài thành công!");
      
      // Reset form
      setStudentName("");
      setStudentClass("");
      setFile(null);

    } catch (err) {
      console.error("❌ Error submitting:", err);
      alert(err?.response?.data?.message || "Không thể nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="sdh-page">
        <div className="sdh-loading">
          <div className="sdh-spinner"></div>
          <p>Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sdh-page">
        <div className="sdh-error">
          <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
          <h2>{error}</h2>
          <p style={{ color: "#6b7280", marginBottom: 20 }}>
            Mã bài tập: <code style={{ 
              background: "#f3f4f6", 
              padding: "4px 8px", 
              borderRadius: 4,
              fontWeight: 700 
            }}>{shareCode}</code>
          </p>
          <button onClick={() => navigate("/student")} className="sdh-btn-back">
            ← Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sdh-page">
      <div className="sdh-container">
        <div className="sdh-header">
          <h1 className="sdh-title">📚 {homework?.title}</h1>
          <div className="sdh-meta">
            {homework?.dueTo && (
              <div className="sdh-deadline">
                ⏰ Hạn nộp: {new Date(homework.dueTo).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        </div>

        {/* Nội dung bài tập */}    
{/* Hiển thị nội dung bài tập trực tiếp */}
    {homework?.attachments?.[0] && (
      <div className="sdh-content">
        <h3>📎 Nội dung đề bài</h3>
        <div className="sdh-file-viewer">
          {homework.attachments[0].mime.includes("pdf") ? (
            // Nếu là PDF thì hiển thị trong khung
            <iframe
              src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${homework.attachments[0].url}#toolbar=0`}
              width="100%"
              height="500px"
              title="Đề bài PDF"
              style={{ border: "1px solid #ddd", borderRadius: "8px" }}
            />
          ) : homework.attachments[0].mime.includes("image") ? (
            // Nếu là Ảnh thì hiển thị ảnh
            <img 
              src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${homework.attachments[0].url}`}
              alt="Đề bài"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          ) : (
            // Nếu là Word/Excel (không xem trực tiếp được) thì hiện link tải
            <div className="sdh-file-preview">
                <p>File này không thể xem trực tiếp. Vui lòng tải về:</p>
                <a 
                    href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${homework.attachments[0].url}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="sdh-file-link"
                >
                    📄 {homework.attachments[0].originalName} (Tải về)
                </a>
            </div>
          )}
        </div>
      </div>
    )}

        {/* Form nộp bài */}
        <form className="sdh-form" onSubmit={handleSubmit}>
          <h3>✍️ Thông tin nộp bài</h3>

          <div className="sdh-field">
            <label htmlFor="studentName">
              Họ và tên <span className="sdh-required">*</span>
            </label>
            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nhập họ tên của bạn"
              required
            />
          </div>

          <div className="sdh-field">
            <label htmlFor="studentClass">Lớp</label>
            <input
              id="studentClass"
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="VD: 12A1"
            />
          </div>

          <div className="sdh-field">
            <label htmlFor="file">
              File bài làm <span className="sdh-required">*</span>
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              required
            />
            {file && (
              <div className="sdh-file-selected">
                ✅ Đã chọn: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="sdh-submit"
            disabled={submitting}
          >
            {submitting ? "Đang nộp bài..." : "📤 Nộp bài"}
          </button>
        </form>
      </div>
    </div>
  );
}