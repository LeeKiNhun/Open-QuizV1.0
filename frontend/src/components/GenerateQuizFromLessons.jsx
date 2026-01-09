import React, { useMemo, useState } from "react";
import { quizApi } from "../api/quizApi";

/**
 * Props:
 * - bankId: string (Mongo _id của QuestionBank)
 * - structure: { topics: [{ id,title,open,lessons:[{id,title}]}] }
 * - bookId?: string
 * - onCreated?: (quiz) => void
 */
export default function GenerateQuizFromLessons({ bankId, structure, bookId, onCreated }) {
  const [selected, setSelected] = useState([]); // lessonIds
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(20);
  const [shuffle, setShuffle] = useState(true);
  const [loading, setLoading] = useState(false);

  const lessons = useMemo(() => {
    const topics = structure?.topics || [];
    const all = [];
    for (const t of topics) {
      for (const l of t?.lessons || []) {
        if (!l?.id) continue;
        all.push({ id: l.id, title: l.title || "(Không tên)" });
      }
    }
    return all;
  }, [structure]);

  const toggle = (lessonId) => {
    setSelected((prev) => (prev.includes(lessonId) ? prev.filter((x) => x !== lessonId) : [...prev, lessonId]));
  };

  const selectAll = () => setSelected(lessons.map((l) => l.id));
  const clearAll = () => setSelected([]);

  const canSubmit = !!bankId && selected.length > 0 && !loading;
  const debugReason = !bankId
  ? "Thiếu bankId"
  : selected.length === 0
  ? "Chưa chọn lesson"
  : loading
  ? "Đang tạo đề"
  : "OK";

  const submit = async () => {
    if (!bankId) return alert("Thiếu bankId (QuestionBank _id).");
    if (selected.length === 0) return alert("Hãy chọn ít nhất 1 lesson.");

    const payload = {
      title: title || `Quiz (${selected.length} bài)`,
      bankId,
      bookId, // optional
      lessonIds: selected,
      numQuestions: Math.max(1, Number(numQuestions) || 20),
      shuffle: !!shuffle,
    };

    console.log("SUBMIT PAYLOAD", payload);

    try {
      setLoading(true);
      const data = await quizApi.generate(payload);

      if (!data?.ok) {
        alert(data?.message || data?.error?.message || "Tạo đề thất bại.");
        return;
      }

      onCreated?.(data.item);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Lỗi tạo đề. Kiểm tra Network/Console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "#fff", marginTop: 12 }}>
      <div style={{ fontWeight: 950, fontSize: 16 }}>Tạo đề từ Lessons</div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 900, color: "#334155" }}>Tên đề</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Unit 1 - A+B"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", fontWeight: 700 }}
        />
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "120px 1fr 120px 1fr", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 900, color: "#334155" }}>Số câu</div>
        <input
          type="number"
          min={1}
          value={numQuestions}
          onChange={(e) => setNumQuestions(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", fontWeight: 700 }}
        />

        <div style={{ fontWeight: 900, color: "#334155" }}>Trộn</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
          <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
          Shuffle
        </label>
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 900, color: "#334155" }}>Chọn lessons</div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={selectAll}
            disabled={lessons.length === 0}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#2563eb" }}
          >
            Chọn tất cả
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={selected.length === 0}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#64748b" }}
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, maxHeight: 260, overflow: "auto", padding: 8, border: "1px solid #eef2f7", borderRadius: 12, background: "#f8fafc" }}>
        {lessons.length === 0 ? (
          <div style={{ color: "#64748b", fontWeight: 700 }}>Ngân hàng chưa có lesson. Hãy tạo/áp cấu trúc trước.</div>
        ) : (
          lessons.map((l) => (
            <label key={l.id} style={{ display: "flex", gap: 10, padding: "8px 6px", cursor: "pointer" }}>
              <input type="checkbox" checked={selected.includes(l.id)} onChange={() => toggle(l.id)} />
              <span style={{ fontWeight: 800 }}>{l.title}</span>
            </label>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          title={debugReason} 
          style={{
            background: canSubmit ? "#111827" : "#94a3b8",
            color: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 950,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Đang tạo..." : "Tạo đề"}
        </button>
      </div>
    </div>
  );
}
