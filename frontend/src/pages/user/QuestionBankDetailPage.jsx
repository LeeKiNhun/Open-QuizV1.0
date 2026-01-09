import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CreateStructureModal from "./CreateStructureModal";
import GenerateQuizFromLessons from "../../components/GenerateQuizFromLessons"; 
import { importSeedQuestions } from "../../api/seedApi";

const LS_KEY = "oq_question_banks_v1";

// ✅ THÊM: base URL backend (sửa nếu backend bạn chạy port khác)
const API_BASE = "http://localhost:5000";

function loadBanks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBanks(next) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

/**
 * ✅ THÊM: Convert structureNodes (MongoDB) -> structure.topics.lessons (UI hiện tại)
 * structureNodes: [{id,parentId,title,type,order,...}]
 */
function nodesToTree(structureNodes) {
  if (!Array.isArray(structureNodes) || structureNodes.length === 0) return null;

  const topics = structureNodes
    .filter((n) => n && (n.parentId === null || n.parentId === undefined))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((t) => {
      const lessons = structureNodes
        .filter((n) => n && n.parentId === t.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((l) => ({ id: l.id, title: l.title }));

      return {
        id: t.id,
        title: t.title,
        open: true, // ✅ default mở để bạn thấy ngay sau khi tạo
        lessons,
      };
    });

  // fallback: nếu không có topic root, coi tất cả là lesson dưới 1 topic
  if (topics.length === 0) {
    return {
      topics: [
        {
          id: "topic_fallback",
          title: "Cấu trúc",
          open: true,
          lessons: structureNodes
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((n) => ({ id: n.id, title: n.title })),
        },
      ],
    };
  }

  return { topics };
}

export default function QuestionBankDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ ĐỔI: dùng state để re-render sau khi Lưu cấu trúc
  const [bank, setBank] = useState(() => loadBanks().find((b) => b.id === id));
  const [tab, setTab] = useState("structure");

  // ✅ THÊM: mở popup + toast
  const [openStructure, setOpenStructure] = useState(false);
  const [toast, setToast] = useState("");

  // ✅ THÊM: lưu cấu trúc để hiển thị (toggle open/close topic)
  const [structure, setStructure] = useState(null);

  // ✅ THÊM: loading cấu trúc từ BE (để reload không mất)
  const [loadingStructure, setLoadingStructure] = useState(false);

  useEffect(() => {
    const b = loadBanks().find((x) => x.id === id);
    setBank(b);
    setStructure(b?.structure || null);
  }, [id]);

  // ✅ THÊM: khi vào trang (hoặc reload), luôn fetch cấu trúc từ MongoDB
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingStructure(true);

        const res = await fetch(`${API_BASE}/api/question-banks/${id}/structure`);
        const data = await res.json();

        if (!alive) return;

        if (res.ok) {
          // data.structureNodes -> tree UI
          const tree = nodesToTree(data.structureNodes || []);
          if (tree) {
            setStructure(tree);

            // ✅ lưu luôn vào localStorage để UI hiện lại nhanh (giữ logic gốc của bạn)
            const banks = loadBanks();
            const idx = banks.findIndex((b) => b.id === id);
            if (idx !== -1) {
              banks[idx] = { ...banks[idx], structure: tree };
              saveBanks(banks);
              setBank(banks[idx]);
            }
          } else {
            // Nếu BE chưa có structure -> giữ nguyên (empty state)
            setStructure(null);
          }
        }
      } catch {
        // BE lỗi thì vẫn cho UI dùng localStorage như cũ
      } finally {
        if (alive) setLoadingStructure(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2500);
  };

  // ✅ THÊM: handler khi modal bấm Lưu
  const handleSavedStructure = (payload) => {
    // payload có thể là:
    // 1) tree cũ: { topics: [...] }
    // 2) response mới từ BE: { structureNodes: [...], ... }
    const newStructure =
      payload?.topics ? payload : nodesToTree(payload?.structureNodes || []) || payload;

    const banks = loadBanks();
    const idx = banks.findIndex((b) => b.id === id);
    if (idx === -1) return;

    const updated = { ...banks[idx], structure: newStructure };
    banks[idx] = updated;
    saveBanks(banks);

    setBank(updated);
    setStructure(newStructure);
    setTab("structure");
    setOpenStructure(false);
    showToast("Tạo cấu trúc ngân hàng thành công!");
  };

  // ✅ THÊM: toggle mở/đóng chủ đề ngay tại trang chi tiết
  const toggleTopic = (topicId) => {
    setStructure((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        topics: prev.topics.map((t) => (t.id === topicId ? { ...t, open: !t.open } : t)),
      };
    });
  };

  if (!bank) {
    return (
      <div style={{ paddingTop: 8 }}>
        <button
          onClick={() => navigate("/nganhang")}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900 }}
        >
          ← Quay lại
        </button>
        <div style={{ marginTop: 10, color: "#ef4444", fontWeight: 900 }}>
          Không tìm thấy ngân hàng câu hỏi.
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8, position: "relative" }}>
      {/* ✅ TOAST */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#22c55e",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 12,
            fontWeight: 900,
            zIndex: 10000,
            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Header + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>
          {bank.ten}{" "}
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>
            ({structure ? "0 Câu hỏi" : "0 Câu hỏi"})
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder="Nhập mã câu hỏi"
            style={{
              width: 260,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              outline: "none",
              background: "#fff",
            }}
          />

          <button
          onClick={async () => {
            try {
              const res = await fetch(`${API_BASE}/api/${id}/questions/seed`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ perLesson: 100 }), // ✅ 100 câu / lesson
              });

              const data = await res.json();

              if (!res.ok || !data?.ok) {
                alert(data?.message || "Seed lỗi");
                return;
              }

              alert(data.message || "Seed xong!");
              // ✅ nếu bạn có UI đếm câu hỏi, bạn có thể reload bank/structure ở đây
              // ví dụ gọi lại fetch structure hoặc gọi API count câu hỏi.
            } catch (e) {
              console.error(e);
              alert("Seed lỗi. Xem console.");
            }
          }}
          style={{
            background: "#0353ffff",
            color: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          + Nhập câu hỏi
        </button>

        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        {[
          { key: "structure", label: "Cấu trúc" },
          { key: "activities", label: "Các hoạt động" },
          { key: "analytics", label: "Phân tích" },
          { key: "permissions", label: "Phân quyền" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 900,
              background: tab === t.key ? "#fff" : "transparent",
              border: tab === t.key ? "1px solid #e2e8f0" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          marginTop: 12,
          background: "#fff",
          border: "1px solid #eef2f7",
          borderRadius: 16,
          padding: 22,
          minHeight: 420,
        }}
      >
        {tab === "structure" && (
          <>
            {/* ✅ loading nhỏ (không phá UI) */}
            {loadingStructure && (
              <div style={{ fontWeight: 800, color: "#64748b", marginBottom: 10 }}>
                Đang tải cấu trúc...
              </div>
            )}

            {/* ✅ Nếu chưa có cấu trúc -> empty state */}
            {!structure && (
              <div style={{ textAlign: "center", paddingTop: 50 }}>
                <div style={{ fontSize: 56, marginBottom: 10 }}>📁</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
                  Chưa có cấu trúc nào được tạo
                </div>
                <div style={{ color: "#64748b", marginBottom: 16 }}>
                  Tạo cấu trúc để tổ chức câu hỏi theo chương, bài học
                </div>

                <button
                  onClick={() => setOpenStructure(true)}
                  style={{
                    background: "#fff",
                    border: "2px solid #4f46e5",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Tạo cấu trúc ngân hàng
                </button>
              </div>
            )}

            {/* ✅ Nếu đã có cấu trúc -> render tree */}
            {structure && (
              <div style={{ paddingTop: 6 }}>
                {structure.topics?.map((t) => (
                  <div key={t.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => toggleTopic(t.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontWeight: 900,
                          fontSize: 16,
                        }}
                        title="Mở/thu gọn"
                      >
                        {t.open ? "▾" : "▸"}
                      </button>
                      <div style={{ fontWeight: 900 }}>
                        Chủ đề: {t.title}{" "}
                        <span style={{ color: "#94a3b8", fontWeight: 800 }}>(0 Câu hỏi)</span>
                      </div>
                    </div>

                    {t.open &&
                      t.lessons?.map((l) => (
                        <div
                          key={l.id}
                          style={{
                            padding: "8px 0 8px 28px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>
                            {l.title}{" "}
                            <span style={{ color: "#94a3b8", fontWeight: 800 }}>(0 Câu hỏi)</span>
                          </div>
                          <div style={{ color: "#94a3b8", fontWeight: 900 }}>•••</div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "activities" && (
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Timeline hoạt động</div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: 12,
                border: "1px solid #eef2f7",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "#fee2e2",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                👤
              </div>
              <div>
                <div style={{ fontWeight: 900 }}>Thêm mới ngân hàng câu hỏi</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{bank.ten}</div>
              </div>
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Danh sách đóng góp</div>
            <div style={{ color: "#64748b" }}>Không có dữ liệu</div>
          </div>
        )}

        {tab === "permissions" && (
          <div style={{ paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>Danh sách thành viên</div>
              <button
                onClick={() => alert("MVP: thêm thành viên sẽ làm sau")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                + THÊM THÀNH VIÊN
              </button>
            </div>

            <div style={{ marginTop: 12, border: "1px solid #eef2f7", borderRadius: 12, overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px",
                  padding: 12,
                  fontWeight: 900,
                  background: "#f8fafc",
                }}
              >
                <div>Họ và tên</div>
                <div>Vai trò</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", padding: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      background: "#fee2e2",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    👤
                  </div>
                  <div style={{ fontWeight: 900 }}>Chủ sở hữu</div>
                </div>
                <div>Chủ sở hữu</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Popup tạo cấu trúc */}
      <CreateStructureModal
        open={openStructure}
        bankId={id} // ✅ TRUYỀN BANK ID
        onClose={() => setOpenStructure(false)}
        onSaved={handleSavedStructure}
      />
      <GenerateQuizFromLessons
        bankId={id}
        structure={structure}
        onCreated={(quiz) => {
          // điều hướng sang trang làm bài / trang chi tiết quiz
          navigate(`/quizzes/${quiz._id}/take`);
        }}
      />
    </div>
  );
}
