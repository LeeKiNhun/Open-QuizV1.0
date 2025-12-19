// src/pages/ClassPages/ClassDetailPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useClassStore } from "../../context/ClassContext";
import AddStudentModal from "./AddStudentModal";
import "./ClassDetailPage.css";

const MENU = [
  { key: "students", label: "Danh sách học sinh", icon: "👤" },
  { key: "exams", label: "Bài tập, đề thi", icon: "🗓" },
  { key: "news", label: "Bảng tin", icon: "📰" },
  { key: "grade", label: "Bảng điểm", icon: "📊" },
  { key: "course", label: "Khóa học trong lớp", icon: "📚" },
];

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("vi-VN");
};

export default function ClassDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { classes, removeStudent } = useClassStore();

  const klass = useMemo(
    () => (classes || []).find((c) => String(c.id) === String(classId)),
    [classes, classId]
  );

  const [openAdd, setOpenAdd] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [q, setQ] = useState("");

  const activeKey = useMemo(() => {
  const parts = location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1]; // có thể là classId hoặc tab
  return MENU.some((m) => m.key === last) ? last : "students";
}, [location.pathname]);


const goTab = (key) => {
  if (key === "students") {
    navigate(`/lop/${classId}`);
    return;
  }
  navigate(`/lop/${classId}/${key}`);
};


  if (!klass) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Không tìm thấy lớp.</div>
        <button type="button" onClick={() => navigate("/lop")}>
          ← Quay lại danh sách lớp
        </button>
      </div>
    );
  }

  const students = klass.students || [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return students;
    return students.filter((st) => {
      const bag = [
        st.fullName,
        st.studentCode,
        st.phone,
        st.email,
        st.studentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return bag.includes(s);
    });
  }, [q, students]);

  const openAddModal = () => {
    setEditingStudent(null);
    setOpenAdd(true);
  };

  const openEditModal = (st) => {
    setEditingStudent(st);
    setOpenAdd(true);
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm("Xóa học sinh này?")) {
      removeStudent(String(classId), String(studentId));
    }
  };
  const { groups } = useClassStore();

  const classTitle = klass?.name || "Lớp";
  const classYear = klass?.schoolYear || "";
    const classGroup = useMemo(() => {
  
    if (klass?.groupName) return klass.groupName;

    if (klass?.groupId) {
        const found = (groups || []).find((g) => String(g.id) === String(klass.groupId));
        if (found?.name) return found.name;
    }

    if (Array.isArray(klass?.groups) && klass.groups.length) return klass.groups[0];

    return "Khác";
    }, [klass, groups]);


  return (
    <div className="cd-page">
      {/* LEFT SIDEBAR */}
      <aside className="cd-side">
        {MENU.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`cd-nav ${activeKey === m.key ? "active" : ""}`}
            onClick={() => goTab(m.key)}
          >
            <span className="cd-ico" aria-hidden="true">
              {m.icon}
            </span>
            <span>{m.label}</span>
          </button>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main className="cd-main">
        {/* TOPBAR */}
        <div className="cd-topbar">
          <div className="cd-title">
            <div className="cd-name">
              {classTitle} <span className="cd-year">({classYear})</span>
            </div>
            <div style={{ fontWeight: 700, color: "#64748b" }}>Nhóm: {classGroup}</div>
          </div>

          <div className="cd-actions">
            <button type="button" className="cd-btn cd-btn-ghost">
              🔗 Chia sẻ
            </button>
            <button type="button" className="cd-btn cd-btn-icon" title="Cài đặt">
              ⚙️
            </button>
          </div>
        </div>

        {/* EMPTY */}
        {students.length === 0 ? (
          <div className="cd-card">
            <div className="cd-empty">
              <div className="cd-box" aria-hidden="true">
                📦
              </div>
              <div className="cd-empty-text">Chưa có dữ liệu học sinh</div>

              <button type="button" className="cd-add" onClick={openAddModal}>
                ＋ Thêm học sinh
              </button>
            </div>
          </div>
        ) : (
          <div className="cdp-content">
            {/* TOOLBAR */}
            <div className="cdp-toolbar">
              <div className="cdp-search">
                <input
                type="text"
                name="class-search"          
                autoComplete="off"            
                placeholder="Tìm theo ID, tên, SĐT, email, SBD"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                />
                <span className="cdp-search-icon">🔍</span>
              </div>

              <button type="button" className="cdp-add-btn" onClick={openAddModal}>
                ＋ Thêm học sinh
              </button>
            </div>

            {/* TABLE */}
            <div className="cdp-table-card">
              <table className="cdp-table">
                <thead>
                  <tr>
                    <th className="cdp-col-check">
                      <input type="checkbox" />
                    </th>
                    <th className="cdp-col-index">Sĩ số: {students.length}</th>
                    <th className="cdp-col-name">Họ và tên</th>
                    <th className="cdp-col-sbd">Số báo danh</th>
                    <th className="cdp-col-bt">Bài tập đã làm</th>
                    <th className="cdp-col-de">Đề thi đã làm</th>
                    <th className="cdp-col-actions">Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((st, idx) => {
                    const avatarChar = (st.fullName || "?")
                      .trim()
                      .charAt(0)
                      .toUpperCase();
                    const isFemale = (st.gender || "").toLowerCase().includes("nữ");
                    const genderSymbol = isFemale ? "♀" : "♂";

                    return (
                      <tr key={st.id} className="cdp-row">
                        <td className="cdp-col-check">
                          <input type="checkbox" />
                        </td>

                        <td className="cdp-col-index">
                          <div className="cdp-index-box">{idx + 1}</div>
                        </td>

                        <td className="cdp-col-name">
                          <div className="cdp-student">
                            <div className="cdp-avatar">{avatarChar}</div>

                            <div className="cdp-st-info">
                              <div className="cdp-st-name-line">
                                <span className="cdp-st-name-text">{st.fullName}</span>
                                <span className="cdp-st-gender">{genderSymbol}</span>
                              </div>

                              <div className="cdp-st-sub">
                                {st.studentId && <div>ID: {st.studentId}</div>}
                                {st.phone && <div>📞 {st.phone}</div>}
                                {st.email && <div>✉ {st.email}</div>}
                                {st.createdAt && (
                                  <div>👤 Ngày tạo: {fmtDate(st.createdAt)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="cdp-col-sbd">
                          <div className="cdp-sbd">{st.studentCode || "-"}</div>
                        </td>

                        <td className="cdp-col-bt">0</td>
                        <td className="cdp-col-de">0</td>

                        <td className="cdp-col-actions">
                          <div className="cdp-actions">
                            <button
                              className="cdp-action-btn edit"
                              type="button"
                              onClick={() => openEditModal(st)}
                            >
                              ✎ Sửa
                            </button>
                            <button
                              className="cdp-action-btn del"
                              type="button"
                              onClick={() => handleDeleteStudent(st.id)}
                            >
                              🗑 Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="cdp-empty">
                        Không có kết quả phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL */}
        <AddStudentModal
          open={openAdd}
          onClose={() => {
            setOpenAdd(false);
            setEditingStudent(null);
          }}
          classId={classId}
          editingStudent={editingStudent}
        />
      </main>
    </div>
  );
}
