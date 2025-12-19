import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

function buildTree(nodes) {
  const map = new Map(nodes.map((n) => [n.id, { ...n, children: [] }]));
  const roots = [];
  for (const n of map.values()) {
    if (n.parentId && map.has(n.parentId)) map.get(n.parentId).children.push(n);
    else roots.push(n);
  }
  const sortRec = (arr) => {
    arr.sort((a, b) => (a.order || 0) - (b.order || 0));
    arr.forEach((x) => sortRec(x.children));
  };
  sortRec(roots);
  return roots;
}

const btn = {
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid rgba(37,99,235,0.35)",
  background: "#fff",
  color: "#2563eb",
  fontWeight: 700,
  cursor: "pointer",
};

const btnPrimary = {
  ...btn,
  background: "#2563eb",
  color: "#fff",
  borderColor: "#2563eb",
};

const btnDanger = {
  ...btn,
  border: "1px dashed rgba(37,99,235,0.45)",
  background: "#f8fbff",
};

function NodeRow({ node, level, onView, onRename, onDelete }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        background: "#fff",
        border: "1px solid rgba(37,99,235,0.15)",
        marginBottom: 8,
        marginLeft: level * 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#eef4ff",
            display: "grid",
            placeItems: "center",
          }}
        >
          📁
        </span>
        <div style={{ fontWeight: 800, color: "#0f172a" }}>{node.title}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>({node.type || "custom"})</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onView(node)} style={btn}>
          Xem
        </button>
        <button onClick={() => onRename(node)} style={btn}>
          Sửa
        </button>
        <button onClick={() => onDelete(node)} style={btnDanger}>
          Xóa
        </button>
      </div>
    </div>
  );
}

export default function QuestionBankStructureManagePage() {
  const { id: bankId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [error, setError] = useState("");

  const tree = useMemo(() => buildTree(nodes), [nodes]);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ cần backend: GET /api/question-banks/:id/structure
      const res = await api.get(`/question-banks/${bankId}/structure`);
      setNodes(res.data.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Không thể tải cấu trúc folder.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankId]);

  const onView = (node) => {
    // Tạm thời: bạn muốn “Xem” mở gì? (list câu hỏi trong folder / chi tiết folder)
    // Hiện tại mình để alert để bạn chạy được trước.
    alert(`Folder: ${node.title}\nnodeId: ${node.id}`);
  };

  const onRename = async (node) => {
    const title = window.prompt("Nhập tên mới:", node.title);
    if (!title || !title.trim()) return;

    try {
      // ✅ cần backend: PATCH /api/question-banks/:id/structure/nodes/:nodeId
      const res = await api.patch(
        `/question-banks/${bankId}/structure/nodes/${node.id}`,
        { title: title.trim() }
      );
      setNodes(res.data.items || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Không thể đổi tên folder.");
    }
  };

  const onDelete = async (node) => {
    if (!window.confirm(`Xóa "${node.title}"? (sẽ xóa cả mục con nếu có)`)) return;

    try {
      // ✅ cần backend: DELETE /api/question-banks/:id/structure/nodes/:nodeId
      const res = await api.delete(
        `/question-banks/${bankId}/structure/nodes/${node.id}`
      );
      setNodes(res.data.items || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Không thể xóa folder.");
    }
  };

  const renderNodes = (arr, level = 0) =>
    arr.map((n) => (
      <div key={n.id}>
        <NodeRow node={n} level={level} onView={onView} onRename={onRename} onDelete={onDelete} />
        {n.children?.length ? renderNodes(n.children, level + 1) : null}
      </div>
    ));

  return (
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 900 }}>Quản lý cấu trúc (Folder)</h2>
          <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>
            Bạn có thể xem / sửa tên / xóa các folder đã tạo từ DOCX.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={btn} onClick={() => navigate(-1)}>Quay lại</button>
          <button style={btnPrimary} onClick={reload}>Tải lại</button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading && <div>Đang tải cấu trúc…</div>}
        {!loading && error && <div style={{ color: "crimson" }}>{error}</div>}

        {!loading && !error && nodes.length === 0 && (
          <div style={{ padding: 14, background: "#fff", borderRadius: 12, border: "1px solid rgba(37,99,235,0.15)" }}>
            Chưa có cấu trúc nào.
          </div>
        )}

        {!loading && !error && nodes.length > 0 && renderNodes(tree)}
      </div>
    </div>
  );
}
