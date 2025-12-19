import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export default function QuestionBankImportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const onChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const form = new FormData();
      // ✅ PHẢI là "file" để khớp multer backend
      form.append("file", file);

      // ✅ ĐÚNG endpoint backend
      await api.post(
        `/question-banks/${id}/structure/upload-docx`,
        form
      );

      // ✅ Upload xong → sang PREVIEW
      navigate(`/nganhang/${id}/structure/preview`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Import DOCX thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Nhập cấu trúc từ DOCX</h2>

      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        style={{ display: "none" }}
        onChange={onChange}
      />

      <div
        onClick={pickFile}
        style={{
          marginTop: 24,
          border: "2px dashed #94a3b8",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        {file ? `Đã chọn: ${file.name}` : "Kéo thả hoặc bấm để chọn file DOCX"}
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={upload} disabled={!file || loading}>
          {loading ? "Đang xử lý..." : "Tiếp tục"}
        </button>
      </div>
    </div>
  );
}
