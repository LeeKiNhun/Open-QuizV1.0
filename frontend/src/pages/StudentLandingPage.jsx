// src/pages/StudentLandingPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentLandingPage.css";

export default function StudentLandingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const cleanCode = code.trim();
    
    if (!cleanCode) {
      alert("Vui lòng nhập mã bài tập");
      return;
    }

    // Chuyển đến trang làm bài
    navigate(`/lam-bai/${cleanCode}`);
  };

  return (
    <div className="student-landing">
      <div className="student-container">
        <div className="student-header">
          <h1>🎓 OpenQuiz - Học sinh</h1>
          <p>Nhập mã bài tập để bắt đầu làm bài</p>
        </div>

        <form className="student-form" onSubmit={handleSubmit}>
          <div className="student-input-group">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã bài tập (VD: ABC1234)"
              className="student-input"
              maxLength={20}
              autoFocus
            />
            <button type="submit" className="student-submit">
              Bắt đầu làm bài →
            </button>
          </div>

          <div className="student-hint">
            💡 Bạn có thể nhận mã từ giáo viên hoặc click vào link được chia sẻ
          </div>
        </form>

        <div className="student-features">
          <div className="student-feature">
            <div className="feature-icon">📝</div>
            <div className="feature-title">Làm bài trực tuyến</div>
            <div className="feature-desc">Hoàn thành bài tập mọi lúc, mọi nơi</div>
          </div>

          <div className="student-feature">
            <div className="feature-icon">📤</div>
            <div className="feature-title">Nộp bài dễ dàng</div>
            <div className="feature-desc">Upload file bài làm nhanh chóng</div>
          </div>

          <div className="student-feature">
            <div className="feature-icon">⏰</div>
            <div className="feature-title">Theo dõi deadline</div>
            <div className="feature-desc">Không bỏ lỡ thời hạn nộp bài</div>
          </div>
        </div>
      </div>
    </div>
  );
}