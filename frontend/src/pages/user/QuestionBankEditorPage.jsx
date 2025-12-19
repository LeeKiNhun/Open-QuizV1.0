import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client"; // giữ đúng client của bạn

const LS_KEY = "oq_question_banks_v1";

function loadBanks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

function normalizeText(s) {
  return String(s || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Tạo folder/cấu trúc từ nội dung preview (chữa cháy, ổn định).
 * - Tạo 1 topic gốc (tên đề)
 * - Sinh nhiều lesson dựa theo heading/bullet/line quan trọng
 */
function buildStructureNodesFromText({ title, content }) {
  const nowId = () => "n_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

  const lines = normalizeText(content)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const topicId = nowId();
  const nodes = [
    {
      id: topicId,
      parentId: null,
      title: title || "Đề từ DOCX",
      type: "topic",
      order: 0,
      meta: {},
    },
  ];

  // Nhận diện “dòng có vẻ là mục/bài/chương/câu”
  const isSection = (l) =>
    /^(Chương|Bài|Mục|Phần|Unit|Lesson|Chủ đề)\b/i.test(l) ||
    /^Câu\s*\d+/i.test(l) ||
    /^(\d{1,3})\s*[\.\)]\s*\S+/.test(l) ||
    /^[-•]\s+/.test(l);

  const picked = [];
  const seen = new Set();

  for (const l of lines) {
    if (!isSection(l)) continue;
    const key = l.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(l);
    if (picked.length >= 80) break; // giới hạn an toàn
  }

  // nếu không bắt được section nào -> tạo 1 lesson “Nội dung DOCX”
  if (picked.length === 0) picked.push("Nội dung DOCX");

  picked.forEach((t, idx) => {
    nodes.push({
      id: nowId(),
      parentId: topicId,
      title: t.slice(0, 220),
      type: "lesson",
      order: idx,
      meta: {},
    });
  });

  return nodes;
}

/**
 * Upload docx để backend trích text (giữ đúng tinh thần luồng cũ của bạn).
 * Backend nên trả về { content } hoặc { text } hoặc { rawText }.
 */
async function uploadImportFile({ bankId, file }) {
  const form = new FormData();
  // để tương thích nhiều backend: append cả 2 key
  form.append("file", file);
  form.append("docx", file);

  const res = await api.post(`/question-banks/${bankId}/import-file`, form);
  return res.data;
}

export default function QuestionBankEditorPage() {
  const navigate = useNavigate();
  const { id: bankId } = useParams();
  const location = useLocation();

  // Nhận state từ ImportPage: { mode:"upload", file } hoặc { mode:"manual" }
  const mode = location?.state?.mode || "manual";
  const passedFile = location?.state?.file || null;

  const bank = useMemo(() => loadBanks().find((b) => b.id === bankId), [bankId]);

  const [title, setTitle] = useState(bank?.ten ? `${bank.ten}` : "Đề từ DOCX");
  const [file, setFile] = useState(passedFile);
  const [content, setContent] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const textAreaRef = useRef(null);

  // Khi vào mode upload có file -> gọi backend trích nội dung để preview
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (mode !== "upload") return;
      if (!file) return;

      setError("");
      setLoadingPreview(true);

      try {
        const data = await uploadImportFile({ bankId, file });

        // chấp nhận nhiều format response
        const preview =
          data?.content ||
          data?.text ||
          data?.rawText ||
          data?.value ||
          "";

        const norm = normalizeText(preview);
        if (!alive) return;

        if (!norm) {
          setError("Không đọc được nội dung từ DOCX. (File có thể là ảnh/scan hoặc backend không trích được text.)");
          setContent("");
        } else {
          setContent(norm);
          setTimeout(() => textAreaRef.current?.focus(), 0);
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Không thể tải nội dung DOCX để xem trước.");
      } finally {
        if (alive) setLoadingPreview(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [mode, file, bankId]);

  const onBackToBank = () => navigate(`/nganhang/${bankId}`);

  // ✅ NÚT “TIẾP TỤC” = TẠO FOLDER/CẤU TRÚC (khôi phục đúng luồng cũ)
  const handleContinueCreateFolders = async () => {
    if (!content.trim()) {
      alert("Nội dung đề đang trống.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const structureNodes = buildStructureNodesFromText({ title, content });

      await api.put(`/question-banks/${bankId}/structure`, {
        structureSource: "docx_preview",
        structureNodes,
      });

      alert("Đã tạo folder/cấu trúc từ nội dung DOCX.");
      navigate(`/nganhang/${bankId}`);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || "Không thể tạo folder/cấu trúc. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <button
        onClick={onBackToBank}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontWeight: 900,
          marginBottom: 10,
        }}
      >
        ← Quay lại
      </button>

      <div style={{ textAlign: "center", fontSize: 22, fontWeight: 900, marginTop: 8 }}>
        {mode === "upload" ? "Xem trước nội dung DOCX" : "Tự soạn đề thi"}
      </div>

      <div style={{ textAlign: "center", color: "#64748b", marginTop: 6, fontWeight: 700 }}>
        {bank ? `Ngân hàng: ${bank.ten}` : "Ngân hàng câu hỏi"}
      </div>

      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #eef2f7",
          borderRadius: 16,
          padding: 22,
          maxWidth: 980,
          marginInline: "auto",
          boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
        }}
      >
        {/* Title */}
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Tiêu đề</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              outline: "none",
              fontWeight: 800,
            }}
          />
        </div>

        {/* File info (mode upload) */}
        {mode === "upload" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>File đã chọn</div>
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {file ? `${file.name} (${formatBytes(file.size)})` : "Không có file"}
            </div>

            {loadingPreview && (
              <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>
                Đang tải nội dung DOCX để xem trước...
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              fontWeight: 900,
            }}
          >
            {error}
          </div>
        )}

        {/* Content preview/editor */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Nội dung</div>
          <textarea
            ref={textAreaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === "upload" ? "Nội dung DOCX sẽ hiển thị ở đây..." : "Nhập nội dung đề thi..."}
            style={{
              marginTop: 8,
              width: "100%",
              minHeight: 360,
              resize: "vertical",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              outline: "none",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={onBackToBank}
            disabled={saving}
            style={{
              background: "#e2e8f0",
              border: "none",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleContinueCreateFolders}
            disabled={saving || loadingPreview || !content.trim()}
            style={{
              background: saving || loadingPreview || !content.trim() ? "#94a3b8" : "#111827",
              color: "#fff",
              border: "none",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 950,
              cursor: saving || loadingPreview || !content.trim() ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Đang tạo folder..." : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}
