import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { libraryApi } from "../../api/libraryApi";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/**
 * CreateStructureModal
 * - choose: chọn Library hoặc Manual
 * - library: chọn bookId -> preview units/lessons -> apply vào bank
 * - manual: tự nhập topic/lesson -> lưu structureNodes vào bank (endpoint cũ /structure)
 */
export default function CreateStructureModal({ open, onClose, onSaved, bankId }) {
  const [step, setStep] = useState("choose"); // choose | library | manual

  // ====== LIBRARY ======
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [bookDetail, setBookDetail] = useState(null); // { bookId, title, units:[{id,title,open,lessons:[{id,code,title}]}] }
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingBookDetail, setLoadingBookDetail] = useState(false);

  // ====== MANUAL ======
  const [manualTopics, setManualTopics] = useState([]); // [{id,title,open,lessons:[{id,title}]}]
  const [topicTitle, setTopicTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [activeTopicId, setActiveTopicId] = useState("");

  // ====== Reset khi mở modal ======
  useEffect(() => {
    if (!open) return;

    setStep("choose");

    // reset library
    setBooks([]);
    setBookId("");
    setBookDetail(null);
    setLoadingBooks(false);
    setLoadingBookDetail(false);

    // reset manual
    setManualTopics([]);
    setTopicTitle("");
    setLessonTitle("");
    setActiveTopicId("");
  }, [open]);

  // ====== Load list books khi vào step library ======
  useEffect(() => {
    if (!open) return;
    if (step !== "library") return;

    (async () => {
      try {
        setLoadingBooks(true);
        const data = await libraryApi.listBooks(); // { ok, items:[{bookId,title}] }
        if (data?.ok) {
          const items = data.items || [];
          setBooks(items);

          // auto select first
          const first = items[0];
          if (first) setBookId((prev) => prev || first.bookId);
        } else {
          alert("Không tải được danh sách sách (library).");
        }
      } catch (e) {
        console.error(e);
        alert("Lỗi tải danh sách sách (library).");
      } finally {
        setLoadingBooks(false);
      }
    })();
  }, [open, step]);

  // ====== Load book detail khi đổi bookId ======
  useEffect(() => {
    if (!open) return;
    if (step !== "library") return;
    if (!bookId) return;

    (async () => {
      try {
        setLoadingBookDetail(true);
        const data = await libraryApi.getBook(bookId); // { ok, item:{ bookId,title,units:[...] } }
        if (data?.ok) {
          const detail = data.item || {};
          const units = (detail.units || []).map((u) => ({ ...u, open: true }));
          setBookDetail({ ...detail, units });
        } else {
          alert("Không tải được cấu trúc sách.");
        }
      } catch (e) {
        console.error(e);
        alert("Lỗi tải cấu trúc sách.");
      } finally {
        setLoadingBookDetail(false);
      }
    })();
  }, [open, step, bookId]);

  // ====== Toggle unit ======
  const toggleUnit = (unitId) => {
    setBookDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: (prev.units || []).map((u) => (u.id === unitId ? { ...u, open: !u.open } : u)),
      };
    });
  };

  // ====== Helpers: convert -> structureNodes (endpoint cũ) ======
  const toStructureNodes = (structure) => {
    const topics = Array.isArray(structure?.topics) ? structure.topics : [];
    const nodes = [];

    topics.forEach((t, ti) => {
      nodes.push({
        id: t.id,
        parentId: null,
        title: t.title,
        type: "topic",
        order: ti,
        meta: { open: !!t.open },
      });

      const lessons = Array.isArray(t.lessons) ? t.lessons : [];
      lessons.forEach((l, li) => {
        nodes.push({
          id: l.id,
          parentId: t.id,
          title: l.title,
          type: "lesson",
          order: li,
          meta: {},
        });
      });
    });

    return nodes;
  };

  // ====== SAVE: library (endpoint mới) ======
  const saveFromLibrary = async () => {
    if (!bankId) return alert("Thiếu bankId");
    if (!bookId) return alert("Vui lòng chọn sách");

    try {
      // backend áp cấu trúc từ thư viện
      await api.put(`/question-banks/${bankId}/structure/from-library`, { bookId });

      // trả về format tree cho page cha dùng ngay (không bắt buộc)
      const structureForOnSaved = {
        source: "library",
        bookId,
        title: bookDetail?.title || "",
        topics: (bookDetail?.units || []).map((u) => ({
          id: u.id,
          title: u.title,
          open: !!u.open,
          lessons: (u.lessons || []).map((l) => ({
            id: l.id,
            title: `Bài ${l.code}: ${l.title}`,
          })),
        })),
      };

      onSaved?.(structureForOnSaved);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert("Không thể áp cấu trúc từ thư viện. Vui lòng thử lại.");
    }
  };

  // ====== SAVE: manual (endpoint cũ) ======
  const canSaveManual = useMemo(() => manualTopics.length > 0, [manualTopics]);

  const addTopic = () => {
    const title = topicTitle.trim();
    if (!title) return alert("Vui lòng nhập tên Chủ đề.");
    const id = uid("t");
    setManualTopics((prev) => [{ id, title, open: true, lessons: [] }, ...prev]);
    setActiveTopicId(id);
    setTopicTitle("");
  };

  const addLesson = () => {
    const title = lessonTitle.trim();
    if (!title) return alert("Vui lòng nhập tên Bài.");
    if (!activeTopicId) return alert("Hãy chọn 1 Chủ đề để thêm Bài.");

    setManualTopics((prev) =>
      prev.map((t) => {
        if (t.id !== activeTopicId) return t;
        return { ...t, lessons: [...(t.lessons || []), { id: uid("l"), title }] };
      })
    );
    setLessonTitle("");
  };

  const toggleManualTopic = (topicId) => {
    setManualTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, open: !t.open } : t)));
  };

  const renameManualTopic = (topicId) => {
    const t = manualTopics.find((x) => x.id === topicId);
    const next = prompt("Đổi tên Chủ đề:", t?.title || "");
    if (!next) return;
    setManualTopics((prev) => prev.map((x) => (x.id === topicId ? { ...x, title: next } : x)));
  };

  const deleteManualTopic = (topicId) => {
    if (!window.confirm("Xóa Chủ đề này và toàn bộ Bài bên trong?")) return;
    setManualTopics((prev) => prev.filter((x) => x.id !== topicId));
    if (activeTopicId === topicId) setActiveTopicId("");
  };

  const renameManualLesson = (topicId, lessonId) => {
    const topic = manualTopics.find((x) => x.id === topicId);
    const lesson = topic?.lessons?.find((l) => l.id === lessonId);
    const next = prompt("Đổi tên Bài:", lesson?.title || "");
    if (!next) return;

    setManualTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        return {
          ...t,
          lessons: (t.lessons || []).map((l) => (l.id === lessonId ? { ...l, title: next } : l)),
        };
      })
    );
  };

  const deleteManualLesson = (topicId, lessonId) => {
    if (!window.confirm("Xóa Bài này?")) return;

    setManualTopics((prev) =>
      prev
        .map((t) => {
          if (t.id !== topicId) return t;
          return { ...t, lessons: (t.lessons || []).filter((l) => l.id !== lessonId) };
        })
        .filter((t) => (t.lessons || []).length > 0 || (t.title || "").trim().length > 0)
    );
  };

  const saveFromManual = async () => {
    if (!bankId) return alert("Thiếu bankId");

    const structure = {
      source: "manual",
      topics: manualTopics.map((t) => ({
        id: t.id,
        title: t.title,
        open: !!t.open,
        lessons: (t.lessons || []).map((l) => ({ id: l.id, title: l.title })),
      })),
    };

    try {
      await api.put(`/question-banks/${bankId}/structure`, {
        structureSource: "manual_entry",
        structureNodes: toStructureNodes(structure),
      });

      onSaved?.(structure);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert("Không thể lưu cấu trúc lên hệ thống. Vui lòng thử lại.");
    }
  };

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
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
          width: "min(1020px, 100%)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: 18, borderBottom: "1px solid #eef2f7" }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Tạo cấu trúc ngân hàng</div>
          <div style={{ marginTop: 6, color: "#64748b", fontWeight: 700 }}>
            Chọn nguồn sách - Hoặc tự nhập cấu trúc
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 18, overflow: "auto" }}>
          {/* ====== STEP CHOOSE ====== */}
          {step === "choose" && (
            <>
              <div style={{ textAlign: "center", marginTop: 6 }}>
                <div style={{ fontSize: 26, fontWeight: 950 }}>Chọn nguồn sách để tạo cấu trúc</div>
                <div style={{ marginTop: 8, color: "#64748b", fontWeight: 700 }}>
                  Lựa chọn phương thức phù hợp để tạo cấu trúc ngân hàng câu hỏi
                </div>
              </div>

              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Library */}
                <div
                  onClick={() => setStep("library")}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 18,
                    cursor: "pointer",
                    minHeight: 320,
                    display: "grid",
                    alignContent: "start",
                    gap: 10,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      width: 86,
                      height: 86,
                      borderRadius: 18,
                      background: "#dbeafe",
                      display: "grid",
                      placeItems: "center",
                      margin: "14px auto 6px",
                      fontSize: 34,
                      fontWeight: 900,
                      color: "#1d4ed8",
                    }}
                  >
                    Ⅳ
                  </div>

                  <div style={{ textAlign: "center", fontSize: 20, fontWeight: 950 }}>Thư viện Openquiz</div>

                  <div style={{ textAlign: "center", color: "#64748b", fontWeight: 700, lineHeight: 1.5 }}>
                    Sử dụng cấu trúc có sẵn theo sách (bookId) để tạo nhanh Unit / Lesson A-B-C-D
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 6 }}>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontWeight: 900, fontSize: 12 }}>
                      ⚡ Nhanh chóng
                    </span>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "#dbeafe", color: "#1d4ed8", fontWeight: 900, fontSize: 12 }}>
                      ✓ Đã kiểm duyệt
                    </span>
                  </div>

                  <div style={{ marginTop: 14, textAlign: "center", color: "#2563eb", fontWeight: 950 }}>
                    Chọn từ thư viện →
                  </div>
                </div>

                {/* Manual */}
                <div
                  onClick={() => setStep("manual")}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 18,
                    cursor: "pointer",
                    minHeight: 320,
                    display: "grid",
                    alignContent: "start",
                    gap: 10,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      width: 86,
                      height: 86,
                      borderRadius: 18,
                      background: "#ffedd5",
                      display: "grid",
                      placeItems: "center",
                      margin: "14px auto 6px",
                      fontSize: 30,
                      fontWeight: 900,
                      color: "#ea580c",
                    }}
                  >
                    ✍
                  </div>

                  <div style={{ textAlign: "center", fontSize: 20, fontWeight: 950 }}>Tự nhập tay</div>

                  <div style={{ textAlign: "center", color: "#64748b", fontWeight: 700, lineHeight: 1.5 }}>
                    Tự tạo cấu trúc bằng cách thêm Chủ đề và Bài (MVP)
                  </div>

                  <div style={{ marginTop: 14, textAlign: "center", color: "#ea580c", fontWeight: 950 }}>
                    Nhập cấu trúc →
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ====== STEP LIBRARY ====== */}
          {step === "library" && (
            <>
              <div style={{ fontWeight: 950, marginBottom: 8 }}>Kho Openquiz</div>

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 900, color: "#334155" }}>Chọn sách</div>
                <select
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
                  disabled={loadingBooks}
                >
                  <option value="">{loadingBooks ? "Đang tải..." : "— Chọn sách —"}</option>
                  {books.map((b) => (
                    <option key={b.bookId} value={b.bookId}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 14, borderTop: "1px solid #eef2f7", paddingTop: 14 }}>
                {loadingBookDetail && <div style={{ color: "#64748b", fontWeight: 700 }}>Đang tải cấu trúc...</div>}

                {!loadingBookDetail && bookDetail?.units?.length ? (
                  bookDetail.units.map((u) => (
                    <div key={u.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 950 }}>
                        <button
                          type="button"
                          onClick={() => toggleUnit(u.id)}
                          style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 950 }}
                        >
                          {u.open ? "▾" : "▸"}
                        </button>
                        <div>Unit: {u.title}</div>
                      </div>

                      {u.open &&
                        (u.lessons || []).map((l) => (
                          <div
                            key={l.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 6px 10px 28px",
                            }}
                          >
                            <div style={{ color: "#0f172a", fontWeight: 700 }}>
                              Bài {l.code}: {l.title}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))
                ) : (
                  !loadingBookDetail && <div style={{ color: "#64748b", fontWeight: 700 }}>Chưa có dữ liệu.</div>
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setStep("choose")}
                  style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: 950, cursor: "pointer" }}
                >
                  ← Quay lại
                </button>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={onClose}
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
                    onClick={saveFromLibrary}
                    style={{
                      background: "#111827",
                      color: "#fff",
                      border: "none",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ====== STEP MANUAL ====== */}
          {step === "manual" && (
            <>
              <div style={{ fontWeight: 950 }}>Tự nhập cấu trúc</div>

              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* LEFT: TREE */}
                <div
                  style={{
                    border: "1px solid #eef2f7",
                    borderRadius: 14,
                    padding: 12,
                    background: "#f8fafc",
                    minHeight: 320,
                  }}
                >
                  <div style={{ fontWeight: 950, marginBottom: 10 }}>Cấu trúc hiện tại</div>

                  {manualTopics.length === 0 ? (
                    <div style={{ color: "#64748b", fontWeight: 700 }}>
                      Chưa có cấu trúc. Hãy thêm <b>Chủ đề</b> ở bên phải.
                    </div>
                  ) : (
                    manualTopics.map((t) => (
                      <div key={t.id} style={{ marginBottom: 10 }}>
                        <div
                          onClick={() => setActiveTopicId(t.id)}
                          style={{
                            border: activeTopicId === t.id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                            background: activeTopicId === t.id ? "#eff6ff" : "#fff",
                            borderRadius: 12,
                            padding: "10px 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleManualTopic(t.id);
                              }}
                              style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 950 }}
                              title="Mở/đóng"
                            >
                              {t.open ? "▾" : "▸"}
                            </button>
                            <div style={{ fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              Chủ đề: {t.title}
                            </div>
                          </div>

                          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <button type="button" onClick={() => renameManualTopic(t.id)} style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900 }}>
                              Sửa
                            </button>
                            <button type="button" onClick={() => deleteManualTopic(t.id)} style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#b91c1c" }}>
                              Xóa
                            </button>
                          </div>
                        </div>

                        {t.open &&
                          (t.lessons || []).map((l) => (
                            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 6px 10px 34px" }}>
                              <div style={{ color: "#0f172a", fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {l.title}
                              </div>
                              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                                <button type="button" onClick={() => renameManualLesson(t.id, l.id)} style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900 }}>
                                  Sửa
                                </button>
                                <button type="button" onClick={() => deleteManualLesson(t.id, l.id)} style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 900, color: "#b91c1c" }} title="Xóa">
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))
                  )}
                </div>

                {/* RIGHT: ADD */}
                <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 12, background: "#fff", height: "fit-content" }}>
                  <div style={{ fontWeight: 950, marginBottom: 8 }}>Thêm mục</div>

                  <div style={{ fontWeight: 900, marginTop: 8, color: "#334155" }}>Chủ đề</div>
                  <input
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    placeholder="Ví dụ: Unit 1 / Chương 1"
                    style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", fontWeight: 700 }}
                  />
                  <button type="button" onClick={addTopic} style={{ width: "100%", marginTop: 10, background: "#111827", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 950, cursor: "pointer" }}>
                    + Thêm chủ đề
                  </button>

                  <div style={{ fontWeight: 900, marginTop: 14, color: "#334155" }}>Bài</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginTop: 4 }}>
                    Chọn 1 chủ đề bên trái trước khi thêm bài.
                  </div>
                  <input
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Ví dụ: Bài A / Grammar / Vocabulary"
                    style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", fontWeight: 700 }}
                  />
                  <button type="button" onClick={addLesson} style={{ width: "100%", marginTop: 10, background: "#eef2ff", color: "#1d4ed8", border: "1px solid #c7d2fe", padding: "10px 14px", borderRadius: 10, fontWeight: 950, cursor: "pointer" }}>
                    + Thêm bài vào chủ đề đang chọn
                  </button>

                  <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Chủ đề đang chọn: <b>{activeTopicId ? "Đã chọn" : "Chưa chọn"}</b>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" onClick={() => setStep("choose")} style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: 950, cursor: "pointer" }}>
                  ← Quay lại
                </button>

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={onClose} style={{ background: "#e2e8f0", border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 950, cursor: "pointer" }}>
                    Hủy
                  </button>

                  <button type="button" onClick={saveFromManual} disabled={!canSaveManual} style={{ background: canSaveManual ? "#111827" : "#94a3b8", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 950, cursor: canSaveManual ? "pointer" : "not-allowed" }}>
                    Lưu
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer: chỉ show ở choose */}
        {step === "choose" && (
          <div style={{ padding: 16, borderTop: "1px solid #eef2f7", display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ background: "#e2e8f0", border: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 950, cursor: "pointer" }}>
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
