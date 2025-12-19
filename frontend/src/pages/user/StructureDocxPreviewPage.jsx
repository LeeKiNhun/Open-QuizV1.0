import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

export default function StructureDocxPreviewPage() {
  const { id: bankId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/question-banks/${bankId}/structure/preview`);
        if (!alive) return;
        setContent(res.data?.text || "");
      } catch (err) {
        if (!alive) return;
        setError("Không thể tải nội dung DOCX.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, [bankId]);

  const handleContinue = async () => {
    try {
      setApplying(true);

      await api.post(`/question-banks/${bankId}/structure/apply`);

      // ✅ chuyển qua tab cấu trúc và reload để chắc chắn thấy folder
      window.location.href = `/nganhang/${bankId}?tab=structure`;
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể tạo cấu trúc folder.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 900 }}>Xem trước nội dung DOCX</h2>

      {loading && <p>Đang tải nội dung…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <pre
          style={{
            marginTop: 16,
            padding: 16,
            background: "#f8fafc",
            borderRadius: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {content || "Không có nội dung."}
        </pre>
      )}

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={() => navigate(-1)}>Quay lại</button>

        <button
          onClick={handleContinue}
          disabled={loading || applying}
          style={{
            background: "#2563eb",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {applying ? "Đang tạo..." : "Tiếp tục"}
        </button>
      </div>
    </div>
  );
}
  