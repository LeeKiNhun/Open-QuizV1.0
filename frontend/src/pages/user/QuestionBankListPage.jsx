// src/pages/user/QuestionBankListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client"; // ✅ CHỈ THÊM: dùng axios client đã có interceptor token

const LS_KEY = "oq_question_banks_v1"; // giữ nguyên (fallback nếu API lỗi)

function loadBanksLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveBanksLocal(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/** =========================
 *  ✅ API helpers (chỉ sửa đúng phần gọi API)
 *  ========================= */

// ✅ CHỈ SỬA: dùng axios client (token tự gắn) -> tránh “bấm lưu không gửi request / 401”
async function apiGetBanks() {
  const res = await api.get("/question-banks");
  return res.data; // { items, page, limit, total }
}

async function apiCreateBank(payload) {
  const res = await api.post("/question-banks", payload);
  return res.data; // bank object
}

async function apiDeleteBank(id) {
  const res = await api.delete(`/question-banks/${id}`);
  return res.data;
}

/** map dữ liệu từ backend -> giữ đúng key UI đang dùng */
function mapBankFromApi(b) {
  return {
    id: b._id, // UI dùng id để navigate
    ten: b.name,
    khoi: b.grade || "Khối 10",
    mon: b.subject || "Tiếng Anh",
    createdAt: b.createdAt,
    questionCount: typeof b.questionCount === "number" ? b.questionCount : 0,
  };
}

function CreateBankModal({ open, onClose, onCreated }) {
  const [ten, setTen] = useState("");
  const [khoi, setKhoi] = useState("Khối 10");
  const [mon, setMon] = useState("Tiếng Anh");

  useEffect(() => {
    if (open) {
      setTen("");
      setKhoi("Khối 10");
      setMon("Tiếng Anh");
    }
  }, [open]);

  const canSave = useMemo(() => ten.trim().length > 0, [ten]);

  const handleSave = async () => {
    if (!canSave) return;

    try {
      const created = await apiCreateBank({
        name: ten.trim(),
        grade: khoi,
        subject: mon,
        book: "",
      });

      const raw = created?.bank || created?.data?.bank || created?.data || created;

      const bank = mapBankFromApi(raw);

      const current = loadBanksLocal();
      const next = [bank, ...current.filter((x) => x.id !== bank.id)];
      saveBanksLocal(next);

      onCreated(bank);
      onClose();
    } catch (err) {
      // ✅ CHỈ THÊM 1 DÒNG: báo lỗi rõ để bạn không bị “bấm lưu không thấy gì”
      alert(err?.response?.data?.message || err?.message || "Lưu thất bại");

      const id = String(Date.now());
      const bank = {
        id,
        ten: ten.trim(),
        khoi,
        mon,
        createdAt: new Date().toISOString(),
        questionCount: 0,
      };

      const current = loadBanksLocal();
      const next = [bank, ...current];
      saveBanksLocal(next);

      onCreated(bank);
      onClose();

      console.warn("Create bank API failed, fallback localStorage:", err?.message || err);
    }
  };

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 18, borderBottom: "1px solid #eef2f7" }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Tạo ngân hàng câu hỏi mới</div>
        </div>

        <div style={{ padding: 18 }}>
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
        </div>

        <div
          style={{
            padding: 18,
            borderTop: "1px solid #eef2f7",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
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
            type="button"
            onClick={handleSave}
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

export default function QuestionBankListPage() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);

  const refresh = async () => {
    try {
      const data = await apiGetBanks();

      const rawItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : Array.isArray(data?.data?.items)
            ? data.data.items
            : Array.isArray(data?.data)
              ? data.data
              : [];

      const items = rawItems.map(mapBankFromApi);
      setBanks(items);

      saveBanksLocal(items);
    } catch (err) {
      console.warn("Load banks API failed, fallback localStorage:", err?.message || err);

      const local = loadBanksLocal();
      if (local.length > 0) setBanks(local);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = banks.length === 0;

  const handleDeleteBank = async (e, bank) => {
    e.stopPropagation();
    const ok = window.confirm(`Bạn có chắc muốn xóa ngân hàng "${bank.ten}" không?`);
    if (!ok) return;

    try {
      await apiDeleteBank(bank.id);
      await refresh();
    } catch (err) {
      console.warn("Delete bank API failed, fallback localStorage:", err?.message || err);

      const next = loadBanksLocal().filter((x) => x.id !== bank.id);
      saveBanksLocal(next);
      setBanks(next);

      alert(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button
          onClick={() => setOpenCreate(true)}
          style={{
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ＋ Tạo ngân hàng mới
        </button>
      </div>

      {isEmpty ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #eef2f7",
            borderRadius: 16,
            minHeight: 420,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 56, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>
              Bạn chưa có ngân hàng câu hỏi nào
            </div>
            <button
              onClick={() => setOpenCreate(true)}
              style={{
                background: "#1d4ed8",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 10,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              + Tạo ngân hàng mới
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #eef2f7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: 14, borderBottom: "1px solid #eef2f7", fontWeight: 900 }}>
            Danh sách ngân hàng
          </div>

          {banks.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/nganhang/${b.id}`)}
              style={{
                padding: 14,
                display: "flex",
                gap: 12,
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eef2ff", display: "grid", placeItems: "center" }}>
                🏛️
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900 }}>{b.ten}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  {b.khoi} • {b.mon}
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 900, background: "#eef2ff", padding: "6px 10px", borderRadius: 999 }}>
                0 câu
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteBank(e, b)}
                title="Xóa ngân hàng"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#ef4444",
                  padding: "4px 6px",
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateBankModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(bank) => {
          setBanks((prev) => [bank, ...prev.filter((x) => x.id !== bank.id)]);
          navigate(`/nganhang/${bank.id}`);
          refresh();
        }}
      />
    </div>
  );
}
