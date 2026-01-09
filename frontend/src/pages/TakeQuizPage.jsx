//# Làm bài trắc nghiệm (guest + user đều dùng)
// frontend/src/pages/TakeQuizPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizApi } from "../api/quizApi";
import { attemptApi } from "../api/attemptApi";

export default function TakeQuizPage() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [submitting, setSubmitting] = useState(false);

  // Load quiz + start attempt
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const q = await quizApi.getById(quizId);
        if (!alive) return;
        if (!q?.ok) throw new Error(q?.message || "Load quiz failed");
        setQuiz(q.item);

        const a = await attemptApi.start(quizId);
        if (!alive) return;
        if (!a?.ok) throw new Error(a?.message || "Start attempt failed");
        setAttempt(a.item);
      } catch (e) {
        console.error(e);
        alert("Không tải được quiz/attempt. Kiểm tra login + API.");
        navigate("/");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [quizId, navigate]);

  const questions = useMemo(() => {
    return quiz?.questionIds || []; // populated questions
  }, [quiz]);

  const current = questions[idx];

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const choose = (questionId, choiceIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceIndex }));
  };

  const goPrev = () => setIdx((i) => Math.max(0, i - 1));
  const goNext = () => setIdx((i) => Math.min(questions.length - 1, i + 1));

  const submit = async () => {
    if (!attempt?._id) return alert("Thiếu attemptId");
    if (!questions.length) return alert("Quiz không có câu hỏi");

    const payload = questions
      .filter((q) => answers[q._id] !== undefined)
      .map((q) => ({ questionId: q._id, selectedIndex: answers[q._id] }));

    if (payload.length === 0) return alert("Bạn chưa chọn đáp án nào.");

    if (!window.confirm(`Nộp bài? Bạn đã làm ${payload.length}/${questions.length} câu.`)) return;

    try {
      setSubmitting(true);
      const r = await attemptApi.submit(attempt._id, payload);
      if (!r?.ok) {
        alert(r?.message || "Submit failed");
        return;
      }

      // MVP: show kết quả nhanh tại đây
      alert(`Nộp bài thành công! Điểm: ${r.item.score}/${r.item.total}`);

      // Nếu bạn có QuizResultPage theo attemptId: navigate(`/attempts/${attempt._id}/result`)
      // Tạm thời quay về trang chi tiết quiz hoặc home
      navigate(`/attempts/${attempt._id}`); // bạn có thể làm page result sau
    } catch (e) {
      console.error(e);
      alert("Lỗi nộp bài. Xem console.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 18, fontWeight: 800 }}>Đang tải quiz...</div>;
  }

  if (!quiz) {
    return <div style={{ padding: 18, fontWeight: 800 }}>Không tìm thấy quiz.</div>;
  }

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 950 }}>{quiz.title}</div>
          <div style={{ marginTop: 4, color: "#64748b", fontWeight: 700 }}>
            Câu {idx + 1}/{questions.length} • Đã trả lời {answeredCount}/{questions.length}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          style={{
            background: submitting ? "#94a3b8" : "#111827",
            color: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 950,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Đang nộp..." : "Nộp bài"}
        </button>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
        {/* Main question */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#fff" }}>
          {!current ? (
            <div style={{ color: "#64748b", fontWeight: 800 }}>Quiz không có câu hỏi.</div>
          ) : (
            <>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Câu {idx + 1}</div>
              <div style={{ marginTop: 10, fontWeight: 800, lineHeight: 1.5 }}>
                {current.content}
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {(current.choices || []).map((c, i) => {
                  const checked = answers[current._id] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => choose(current._id, i)}
                      style={{
                        textAlign: "left",
                        borderRadius: 12,
                        border: checked ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: checked ? "#eff6ff" : "#fff",
                        padding: "10px 12px",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ marginRight: 10, fontWeight: 950 }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {c}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                <button
                  onClick={goPrev}
                  disabled={idx === 0}
                  style={{
                    background: "#e2e8f0",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontWeight: 900,
                    cursor: idx === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Trước
                </button>

                <button
                  onClick={goNext}
                  disabled={idx === questions.length - 1}
                  style={{
                    background: "#e2e8f0",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontWeight: 900,
                    cursor: idx === questions.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Sau →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigator */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#fff" }}>
          <div style={{ fontWeight: 950 }}>Điều hướng câu hỏi</div>

          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 8,
            }}
          >
            {questions.map((q, i) => {
              const done = answers[q._id] !== undefined;
              const active = i === idx;
              return (
                <button
                  key={q._id}
                  onClick={() => setIdx(i)}
                  style={{
                    borderRadius: 10,
                    padding: "10px 0",
                    fontWeight: 950,
                    border: active ? "2px solid #111827" : "1px solid #e2e8f0",
                    background: done ? "#dcfce7" : "#fff",
                    cursor: "pointer",
                  }}
                  title={done ? "Đã trả lời" : "Chưa trả lời"}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12, color: "#64748b", fontWeight: 700, fontSize: 13 }}>
            Xanh = đã trả lời • Viền đậm = đang xem
          </div>

          <div style={{ marginTop: 12, borderTop: "1px solid #eef2f7", paddingTop: 12 }}>
            <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
              Attempt: <b>{attempt?._id || "—"}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
