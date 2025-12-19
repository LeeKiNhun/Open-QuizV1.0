// src/layouts/HomeWorkLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listHomeworks, deleteHomework } from "../api/homeworkApi"; // ✅ sửa path nếu api bạn nằm chỗ khác
import "./HomeWorkLayout.css";

export default function HomeWorkLayout() {
  const navigate = useNavigate();

  const [isDarkMode] = useState(false);
  const rootClass = useMemo(
    () => `hw-layout ${isDarkMode ? "dark-mode" : ""}`,
    [isDarkMode]
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  // fetch list (dùng lại cho retry)
  const fetchList = async (aliveRef) => {
    try {
      setLoading(true);
      setError("");

      const data = await listHomeworks();
      if (aliveRef && !aliveRef.current) return;

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setItems(arr);
    } catch (e) {
      if (aliveRef && !aliveRef.current) return;
      setError(e?.response?.data?.message || "Không thể tải danh sách bài tập.");
    } finally {
      if (!aliveRef || aliveRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const aliveRef = { current: true };
    fetchList(aliveRef);
    return () => {
      aliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return items;
    return items.filter((x) => (x.title || "").toLowerCase().includes(kw));
  }, [items, q]);

  return (
    <div className={rootClass}>
      {/* TOPBAR: SEARCH + CREATE */}
      <div className="hw-topbar">
        <div className="hw-search">
          <input
            placeholder="Tìm kiếm theo tên bài tập"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span aria-hidden="true">🔍</span>
        </div>

        <button className="hw-create-btn" onClick={() => navigate("/baitap/tao")}>
          + Tạo bài tập
        </button>
      </div>

      <div className="hw-content">
        <h3 className="hw-title">Tất cả</h3>

        {loading && <div className="hw-loading">Đang tải...</div>}

        {!loading && error && (
          <div className="hw-error">
            {error}
            <button className="hw-retry" onClick={() => fetchList()}>
              Tải lại
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="hw-empty">Chưa có bài tập nào.</div>
        )}

        {!loading && !error && (
          <div className="hw-list">
            {filtered.map((hw) => (
              <div key={hw._id} className="hw-card">
                <div
                  className="hw-card-main"
                  onClick={() => navigate(`/baitap/${hw._id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="hw-card-title">📄 {hw.title}</div>

                  <div className="hw-card-meta">
                    Ngày tạo:{" "}
                    {hw.createdAt
                      ? new Date(hw.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </div>

                  <div className="hw-card-meta">
                    Thời gian nộp bài:{" "}
                    {hw.dueTo
                      ? new Date(hw.dueTo).toLocaleString("vi-VN")
                      : "Không thời hạn"}
                  </div>
                </div>

                <div className="hw-card-actions">
                  <button
                    className="hw-del-btn"
                    onClick={async () => {
                      if (!window.confirm("Xóa bài tập này?")) return;
                      try {
                        await deleteHomework(hw._id);
                        setItems((prev) => prev.filter((x) => x._id !== hw._id));
                      } catch (e) {
                        alert(e?.response?.data?.message || "Không thể xóa bài tập.");
                      }
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
