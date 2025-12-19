import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClassStore } from "../../context/ClassContext";
import AddTeacherModal from "./AddTeacherModal";
import AddTeacherGroupModal from "./AddTeacherGroupModal";
import SelectTeachersModal from "./SelectTeachersModal";
import { FaChalkboardTeacher, FaLayerGroup, FaPlus } from "react-icons/fa";
import "./TeacherPage.css";

const PERM_LABELS = {
  homework: "Giao bài tập, giao đề thi",
  grading: "Chấm bài",
  students: "Quản lý danh sách học sinh",
};
function emptyPerm() {
  return { homework: false, grading: false, students: false };
}

export default function TeacherPage() {
  const {
    teachers,
    classes,
    teacherGroups,
    updateTeacherPermissions,

    addTeacherGroup,
    addTeacherToGroup,
    removeTeacherFromGroup,
  } = useClassStore();

  const [classQ, setClassQ] = useState("");
  const [searchTeacher, setSearchTeacher] = useState("");

  // popup “+”
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [openAddTeacher, setOpenAddTeacher] = useState(false);

  // ✅ group modal
  const [openAddGroup, setOpenAddGroup] = useState(false);

  // ✅ select teacher modal
  const [openPickTeacher, setOpenPickTeacher] = useState(false);

  // chọn teacher / group
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // quyền “đang chỉnh”
  const [draftPerms, setDraftPerms] = useState({});
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  useEffect(() => {
    const onDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filteredTeachers = useMemo(() => {
    const s = searchTeacher.trim().toLowerCase();
    if (!s) return teachers || [];
    return (teachers || []).filter((t) => {
      const bag = [t.fullName, t.phone, t.email].filter(Boolean).join(" ").toLowerCase();
      return bag.includes(s);
    });
  }, [searchTeacher, teachers]);

  const filteredGroups = useMemo(() => {
    const s = searchTeacher.trim().toLowerCase();
    const arr = teacherGroups || [];
    if (!s) return arr;
    return arr.filter((g) => String(g.name || "").toLowerCase().includes(s));
  }, [searchTeacher, teacherGroups]);

  const selectedTeacher = useMemo(() => {
    return (teachers || []).find((t) => String(t.id) === String(selectedTeacherId)) || null;
  }, [teachers, selectedTeacherId]);

  const selectedGroup = useMemo(() => {
    return (teacherGroups || []).find((g) => String(g.id) === String(selectedGroupId)) || null;
  }, [teacherGroups, selectedGroupId]);

  // auto chọn teacher đầu tiên nếu có (khi không chọn group)
  useEffect(() => {
    if (!selectedTeacherId && !selectedGroupId && (teachers || []).length) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId, selectedGroupId]);

  // khi đổi teacher -> load permissions vào draft
  useEffect(() => {
    if (!selectedTeacher) {
      setDraftPerms({});
      return;
    }
    setDraftPerms(selectedTeacher.permissions || {});
  }, [selectedTeacher?.id]); // eslint-disable-line

  const classList = useMemo(() => {
    const s = classQ.trim().toLowerCase();
    let arr = classes || [];
    if (s) arr = arr.filter((c) => String(c.name || "").toLowerCase().includes(s));

    if (onlyAssigned) {
      arr = arr.filter((c) => {
        const p = draftPerms?.[c.id];
        return p && (p.homework || p.grading || p.students);
      });
    }
    return arr;
  }, [classes, classQ, onlyAssigned, draftPerms]);

  const grouped = useMemo(() => {
    const map = new Map();
    classList.forEach((c) => {
      const g = c.groupName || "Khác";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(c);
    });
    return Array.from(map.entries()).map(([groupName, items]) => ({ groupName, items }));
  }, [classList]);

  const toggleOne = (classId, key) => {
    setDraftPerms((prev) => {
      const cur = prev?.[classId] || emptyPerm();
      const next = { ...cur, [key]: !cur[key] };
      return { ...(prev || {}), [classId]: next };
    });
  };

  const setAllForAllClasses = (checked) => {
    setDraftPerms((prev) => {
      const next = { ...(prev || {}) };
      (classes || []).forEach((c) => {
        next[c.id] = checked
          ? { homework: true, grading: true, students: true }
          : { homework: false, grading: false, students: false };
      });
      return next;
    });
  };

  const allChecked = useMemo(() => {
    if (!(classes || []).length) return false;
    return (classes || []).every((c) => {
      const p = draftPerms?.[c.id] || emptyPerm();
      return p.homework && p.grading && p.students;
    });
  }, [classes, draftPerms]);

  const savePermissions = () => {
    if (!selectedTeacher) return;
    updateTeacherPermissions(String(selectedTeacher.id), draftPerms);
    alert("Cấp quyền thành công ✅");
  };

  // ======= GROUP MEMBERS =======
  const groupMemberTeachers = useMemo(() => {
    if (!selectedGroup) return [];
    const ids = selectedGroup.memberIds || [];
    return (teachers || []).filter((t) => ids.some((id) => String(id) === String(t.id)));
  }, [selectedGroup, teachers]);

  const pickTeacher = (teacherId) => {
    if (!selectedGroup) return;
    addTeacherToGroup(selectedGroup.id, teacherId);
  };

  const removeMember = (teacherId) => {
    if (!selectedGroup) return;
    removeTeacherFromGroup(selectedGroup.id, teacherId);
  };

  return (
    <div className="tp-page">
      {/* LEFT */}
      <aside className="tp-left">
        <div className="tp-left-top">
          <div className="tp-search">
            <input
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
              placeholder="Tìm tên, phone hoặc Email"
            />
            <span className="tp-search-ico">🔍</span>
          </div>

          <div className="tp-plus-wrap" ref={menuRef}>
            <button
              type="button"
              className="tp-plus"
              onClick={() => setMenuOpen((v) => !v)}
              title="Thêm"
            >
              <FaPlus />
            </button>

            {menuOpen && (
              <div className="tp-pop">
                <button
                  type="button"
                  className="tp-pop-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenAddTeacher(true);
                  }}
                >
                  <FaChalkboardTeacher />
                  <span>Thêm giáo viên</span>
                </button>

                <button
                  type="button"
                  className="tp-pop-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenAddGroup(true);
                  }}
                >
                  <FaLayerGroup />
                  <span>Thêm nhóm giáo viên</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="tp-left-body">
          {(filteredGroups.length === 0 && filteredTeachers.length === 0) ? (
            <div className="tp-empty-left">Chưa có nhóm hoặc giáo viên</div>
          ) : (
            <div className="tp-list">
              {/* ✅ GROUPS */}
              {filteredGroups.map((g) => {
                const active = String(g.id) === String(selectedGroupId);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`tp-item ${active ? "active" : ""}`}
                    onClick={() => {
                      setSelectedGroupId(g.id);
                      setSelectedTeacherId(null);
                    }}
                  >
                    <div className="tp-avatar">👥</div>
                    <div className="tp-item-info">
                      <div className="tp-item-name">{g.name}</div>
                      <div className="tp-item-sub">Nhóm giáo viên</div>
                    </div>
                    <div className="tp-dots">⋮</div>
                  </button>
                );
              })}

              {/* ✅ TEACHERS */}
              {filteredTeachers.map((t) => {
                const active = String(t.id) === String(selectedTeacherId);
                const initials = String(t.fullName || "GV")
                  .trim()
                  .split(" ")
                  .slice(-2)
                  .map((x) => x[0]?.toUpperCase())
                  .join("")
                  .slice(0, 2);

                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`tp-item ${active ? "active" : ""}`}
                    onClick={() => {
                      setSelectedTeacherId(t.id);
                      setSelectedGroupId(null);
                    }}
                  >
                    <div className="tp-avatar">{initials || "GV"}</div>
                    <div className="tp-item-info">
                      <div className="tp-item-name">{t.fullName}</div>
                      <div className="tp-item-sub">{t.email}</div>
                    </div>
                    <div className="tp-dots">⋮</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT */}
      <main className="tp-right">
        <div className="tp-right-top">
          <button className="tp-mini" type="button" title="Danh sách">
            ▣
          </button>
          <div className="tp-right-bar" />
        </div>

        {/* ✅ nếu chọn GROUP -> hiện Thành viên nhóm */}
        {selectedGroup ? (
          <div className="tp-panel">
            <div className="tp-panel-head">
              <div className="tp-panel-title">Thành viên trong nhóm: {selectedGroup.name}</div>
            </div>

            <div className="tp-members">
              <button
                type="button"
                className="tp-member tp-add-member"
                onClick={() => setOpenPickTeacher(true)}
                title="Thêm"
              >
                <div className="tp-member-circle">＋</div>
                <div className="tp-member-name">Thêm...</div>
              </button>

              {groupMemberTeachers.map((t) => {
                const initials = String(t.fullName || "GV")
                  .trim()
                  .split(" ")
                  .slice(-2)
                  .map((x) => x[0]?.toUpperCase())
                  .join("")
                  .slice(0, 2);

                return (
                  <div key={t.id} className="tp-member">
                    <div className="tp-member-circle">{initials || "GV"}</div>
                    <div className="tp-member-name">{t.fullName}</div>
                    <button
                      type="button"
                      className="tp-member-x"
                      onClick={() => removeMember(t.id)}
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* bạn có thể để phần phân quyền ở đây nếu muốn áp dụng cho nhóm,
               nhưng yêu cầu hiện tại chỉ cần member UI */}
          </div>
        ) : !selectedTeacher ? (
          <div className="tp-empty-right">
            <div className="tp-box">📦</div>
            <div className="tp-empty-text">Chưa có dữ liệu</div>
          </div>
        ) : (
          // ✅ chọn teacher -> giữ nguyên phần phân quyền bạn đang làm
          <div className="tp-panel">
            <div className="tp-panel-head">
              <div className="tp-panel-title">Phân quyền trong lớp</div>

              <div className="tp-panel-actions">
                <label className="tp-check">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => setAllForAllClasses(e.target.checked)}
                  />
                  <span>Chọn tất cả</span>
                </label>

                <label className="tp-check">
                  <input
                    type="checkbox"
                    checked={onlyAssigned}
                    onChange={(e) => setOnlyAssigned(e.target.checked)}
                  />
                  <span>Lớp đã gán quyền</span>
                </label>

                <button
                  type="button"
                  className="tp-btn ghost"
                  onClick={() => setDraftPerms(selectedTeacher.permissions || {})}
                >
                  Hủy
                </button>
                <button type="button" className="tp-btn primary" onClick={savePermissions}>
                  Lưu
                </button>
              </div>
            </div>

            <div className="tp-class-search">
              <input
                value={classQ}
                onChange={(e) => setClassQ(e.target.value)}
                placeholder="Tìm kiếm theo tên lớp"
              />
              <span className="tp-search-ico2">🔍</span>
            </div>

            <div className="tp-groups">
              {grouped.map((g) => {
                const total = g.items.length;
                const assigned = g.items.filter((c) => {
                  const p = draftPerms?.[c.id];
                  return p && (p.homework || p.grading || p.students);
                }).length;

                return (
                  <div key={g.groupName} className="tp-group">
                    <div className="tp-group-head">
                      <div className="tp-group-title">
                        {g.groupName} ({assigned}/{total} lớp)
                      </div>
                    </div>

                    <div className="tp-group-body">
                      {g.items.map((c) => {
                        const p = draftPerms?.[c.id] || emptyPerm();
                        return (
                          <div key={c.id} className="tp-class-card">
                            <div className="tp-class-name">{c.name}</div>

                            <label className="tp-perm">
                              <input
                                type="checkbox"
                                checked={!!p.homework}
                                onChange={() => toggleOne(c.id, "homework")}
                              />
                              <span>{PERM_LABELS.homework}</span>
                            </label>

                            <label className="tp-perm">
                              <input
                                type="checkbox"
                                checked={!!p.grading}
                                onChange={() => toggleOne(c.id, "grading")}
                              />
                              <span>{PERM_LABELS.grading}</span>
                            </label>

                            <label className="tp-perm">
                              <input
                                type="checkbox"
                                checked={!!p.students}
                                onChange={() => toggleOne(c.id, "students")}
                              />
                              <span>{PERM_LABELS.students}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* modal thêm teacher (bạn giữ file của bạn) */}
      <AddTeacherModal open={openAddTeacher} onClose={() => setOpenAddTeacher(false)} />

      {/* modal thêm group */}
      <AddTeacherGroupModal
        open={openAddGroup}
        onClose={() => setOpenAddGroup(false)}
        onCreate={(name) => {
          const rs = addTeacherGroup(name);
          if (rs?.ok) setSelectedGroupId(rs.group.id);
          return rs;
        }}
      />

      {/* modal chọn teacher để add vào group */}
      <SelectTeachersModal
        open={openPickTeacher}
        onClose={() => setOpenPickTeacher(false)}
        teachers={teachers}
        pickedIds={selectedGroup?.memberIds || []}
        onPick={(teacherId) => pickTeacher(teacherId)}
      />
    </div>
  );
}
