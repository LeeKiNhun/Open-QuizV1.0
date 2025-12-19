import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const LS_KEY = "oq_bank_structures_v1";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeAll(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function findNode(tree, id) {
  for (const n of tree) {
    if (n.id === id) return n;
    const hit = findNode(n.children || [], id);
    if (hit) return hit;
  }
  return null;
}
function removeNode(tree, id) {
  return tree
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children || [], id) }));
}

function TreeView({ nodes, activeId, setActiveId, onRename, onDelete, level = 0 }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {nodes.map((n) => {
        const active = n.id === activeId;
        return (
          <div key={n.id}>
            <div
              onClick={() => setActiveId(n.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: active ? "2px solid #1d4ed8" : "1px solid #e2e8f0",
                background: active ? "#eff6ff" : "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginLeft: level * 14,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={n.title}
              >
                {n.title}
              </div>

              <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => onRename(n.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #fecaca",
                    background: "#fee2e2",
                    color: "#991b1b",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>

            {n.children?.length ? (
              <TreeView
                nodes={n.children}
                activeId={activeId}
                setActiveId={setActiveId}
                onRename={onRename}
                onDelete={onDelete}
                level={level + 1}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function QuestionBankStructureCreatePage() {
  const navigate = useNavigate();
  const { id: bankId } = useParams();

  // giữ dropdown như file cũ
  const [grade, setGrade] = useState("Khối 10");
  const [subject, setSubject] = useState("Tiếng Anh");

  // load cấu trúc đã lưu
  const initialTree = useMemo(() => {
    const all = readAll();
    const saved = all?.[bankId];
    return Array.isArray(saved) ? saved : [];
  }, [bankId]);

  const [tree, setTree] = useState(initialTree);
  const [activeId, setActiveId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const addRoot = () => {
    setErr("");
    setOkMsg("");
    const title = newTitle.trim();
    if (!title) return setErr("Vui lòng nhập tên chương/bài/mục.");
    setTree((prev) => [{ id: uid(), title, children: [] }, ...prev]);
    setNewTitle("");
    setOkMsg("Đã thêm mục gốc.");
  };

  const addChild = () => {
    setErr("");
    setOkMsg("");
    const title = newTitle.trim();
    if (!title) return setErr("Vui lòng nhập tên chương/bài/mục.");
    if (!activeId) return setErr("Hãy chọn 1 mục trong cây để thêm mục con.");

    setTree((prev) => {
      const clone = structuredClone(prev);
      const node = findNode(clone, activeId);
      if (!node) return prev;
      node.children = node.children || [];
      node.children.push({ id: uid(), title, children: [] });
      return clone;
    });

    setNewTitle("");
    setOkMsg("Đã thêm mục con.");
  };

  const renameNode = (nodeId) => {
    const title = prompt("Đổi tên:", "");
    if (!title) return;
    setTree((prev) => {
      const clone = structuredClone(prev);
      const node = findNode(clone, nodeId);
      if (!node) return prev;
      node.title = title;
      return clone;
    });
  };

  const deleteNode = (nodeId) => {
    if (!window.confirm("Xóa mục này và toàn bộ mục con?")) return;
    setTree((prev) => removeNode(prev, nodeId));
    if (activeId === nodeId) setActiveId("");
  };

  const saveStructure = () => {
    if (!bankId) return setErr("Thiếu bankId trên URL.");
    setErr("");
    setOkMsg("");

    const all = readAll();
    all[bankId] = tree;
    all[`${bankId}__meta`] = { grade, subject, updatedAt: new Date().toISOString() };
    writeAll(all);

    setOkMsg("Đã lưu cấu trúc ngân hàng.");
    setTimeout(() => navigate(`/nganhang/${bankId}`), 300);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Tạo cấu trúc ngân hàng</div>
          <div style={{ marginTop: 6, color: "#64748b", fontWeight: 700 }}>
            Tự nhập cấu trúc (Chương / Bài / Mục)
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "#e2e8f0",
            border: "none",
            padding: "10px 14px",
            borderRadius: 12,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Hủy
        </button>
      </div>

      <div style={{ marginTop: 18, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18 }}>
        {/* Filters giữ nguyên */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            style={{ padding: 10, borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: 800 }}
          >
            <option>Khối 10</option>
            <option>Khối 11</option>
            <option>Khối 12</option>
          </select>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ padding: 10, borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: 800 }}
          >
            <option>Tiếng Anh</option>
            <option>Toán</option>
            <option>Vật lý</option>
          </select>
        </div>

        {/* Nhập tay + cây cấu trúc */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 14,
              background: "#f8fafc",
              minHeight: 420,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Cấu trúc hiện tại</div>
            {tree.length === 0 ? (
              <div style={{ color: "#64748b", fontWeight: 700 }}>
                Chưa có cấu trúc nào. Hãy nhập tên và bấm “Thêm mục gốc”.
              </div>
            ) : (
              <TreeView
                nodes={tree}
                activeId={activeId}
                setActiveId={setActiveId}
                onRename={renameNode}
                onDelete={deleteNode}
              />
            )}
          </div>

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 14,
              background: "#fff",
              height: "fit-content",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Thêm mục</div>
            <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              Nhập tên (ví dụ: Chương 1 / Bài 1 / Grammar / Vocabulary…)
            </div>

            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nhập tên chương/bài/mục"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontWeight: 800,
              }}
            />

            <button
              type="button"
              onClick={addRoot}
              style={{
                marginTop: 10,
                width: "100%",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                padding: "12px 12px",
                borderRadius: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              + Thêm mục gốc
            </button>

            <button
              type="button"
              onClick={addChild}
              style={{
                marginTop: 10,
                width: "100%",
                background: "#eef2ff",
                color: "#1d4ed8",
                border: "1px solid #c7d2fe",
                padding: "12px 12px",
                borderRadius: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              + Thêm mục con vào mục đang chọn
            </button>

            <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800, fontSize: 13 }}>
              Mục đang chọn: <b>{activeId ? "Đã chọn" : "Chưa chọn (bấm vào 1 mục trong cây)"}</b>
            </div>
          </div>
        </div>

        {err ? <div style={{ marginTop: 10, color: "#dc2626", fontWeight: 900 }}>{err}</div> : null}
        {okMsg ? <div style={{ marginTop: 10, color: "#16a34a", fontWeight: 900 }}>{okMsg}</div> : null}

        <button
          type="button"
          onClick={saveStructure}
          style={{
            marginTop: 14,
            width: "100%",
            background: "#ea580c",
            color: "#fff",
            border: "none",
            padding: "12px 12px",
            borderRadius: 14,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Lưu cấu trúc →
        </button>
      </div>
    </div>
  );
}
