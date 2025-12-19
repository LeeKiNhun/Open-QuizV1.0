import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const LS_KEY = "oq_question_banks_v1";

function loadBanks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveBanks(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export default function QuestionBankCreatePage() {
  const navigate = useNavigate();

  const [ten, setTen] = useState("");
  const [khoi, setKhoi] = useState("Khối 10");
  const [mon, setMon] = useState("Tiếng Anh");

  const canSave = useMemo(() => ten.trim().length > 0, [ten]);

  const onSave = () => {
    if (!canSave) return;

    const list = loadBanks();
    const id = String(Date.now());

    const bank = {
      id,
      ten: ten.trim(),
      khoi,
      mon,
      createdAt: new Date().toISOString(),
    };

    saveBanks([bank, ...list]);
    navigate(`/nganhang/${id}`);
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <h2 style={{ margin: "0 0 12px" }}>Tạo ngân hàng câu hỏi mới</h2>

      <div style={{ background: "#fff", border: "1px solid #eef2f7", borderRadius: 16, padding: 18 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Tên</div>
          <input
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            placeholder="Nhập tên"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Khối học</div>
            <select
              value={khoi}
              onChange={(e) => setKhoi(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                outline: "none",
                background: "#fff",
              }}
            >
              <option>Khối 10</option>
              <option>Khối 11</option>
              <option>Khối 12</option>
            </select>
          </div>

          <div>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Môn học</div>
            <select
              value={mon}
              onChange={(e) => setMon(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                outline: "none",
                background: "#fff",
              }}
            >
              <option>Tiếng Anh</option>
              <option>Toán</option>
              <option>Ngữ văn</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={() => navigate("/nganhang")}
            style={{
              background: "#e2e8f0",
              border: "none",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>

          <button
            onClick={onSave}
            disabled={!canSave}
            style={{
              background: canSave ? "#1d4ed8" : "#94a3b8",
              color: "#fff",
              border: "none",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 900,
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
