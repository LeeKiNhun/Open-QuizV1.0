// src/pages/TeacherPages/TeacherPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClassStore } from "../../context/ClassContext";
import AddTeacherModal from "./AddTeacherModal";
import SelectTeachersModal from "./SelectTeachersModal";
import { FaChalkboardTeacher, FaLayerGroup, FaPlus } from "react-icons/fa";
import AddTeacherGroupModal from "./AddTeacherGroupModal";
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
  const store = useClassStore();

  const teachers = store?.teachers || [];
  const teacherGroups = store?.teacherGroups || [];
  const classes = store?.classes || [];
  
  const [openAddGroup, setOpenAddGroup] = useState(false);
  const addTeacherGroup = store?.addTeacherGroup || (() => ({ ok: false }));
  const updateTeacherGroup = store?.updateTeacherGroup || (() => ({ ok: false }));
  const deleteTeacherGroup = store?.deleteTeacherGroup || (() => {});
  const addTeacherToGroup = store?.addTeacherToGroup || (() => {});
  const removeTeacherFromGroup = store?.removeTeacherFromGroup || (() => {});

  const updateTeacherPermissions = store?.updateTeacherPermissions || (() => {});
  const updateTeacherGroupPermissions = store?.updateTeacherGroupPermissions || (() => {});

  const deleteTeacher = store?.deleteTeacher || (() => {});
  const updateTeacher = store?.updateTeacher || (() => ({ ok: false }));

  const [searchTeacher, setSearchTeacher] = useState("");
  const [classQ, setClassQ] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const plusMenuRef = useRef(null);

  const [openAddTeacher, setOpenAddTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [openPickTeacher, setOpenPickTeacher] = useState(false);

  const [editingGroup, setEditingGroup] = useState(null);

  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [teacherDotsOpenId, setTeacherDotsOpenId] = useState(null);
  const [groupDotsOpenId, setGroupDotsOpenId] = useState(null);

  // ✅ draft permissions cho entity đang chọn (teacher hoặc group)
  const [draftPerms, setDraftPerms] = useState({}); // classId -> perm
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  // ===== click outside =====
  useEffect(() => {
    const onDown = (e) => {
      // close plus menu
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }

      // close dots menu
      const insideDots = e.target.closest?.(".tp-dots-wrap");
      const insideMenu = e.target.closest?.(".tp-item-menu");
      if (!insideDots && !insideMenu) {
        setTeacherDotsOpenId(null);
        setGroupDotsOpenId(null);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ===== filter teachers =====
  const filteredTeachers = useMemo(() => {
    const s = searchTeacher.trim().toLowerCase();
    if (!s) return teachers;
    return teachers.filter((t) => {
      const bag = [t.fullName, t.phone, t.email].filter(Boolean).join(" ").toLowerCase();
      return bag.includes(s);
    });
  }, [teachers, searchTeacher]);

  const filteredGroups = useMemo(() => {
  const s = searchTeacher.trim().toLowerCase();
  if (!s) return teacherGroups;

  return teacherGroups.filter((g) => {
    const bag = [g.name, `${(g.memberIds || []).length}`]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return bag.includes(s);
  });
}, [teacherGroups, searchTeacher]);
  // ===== selected teacher/group =====
  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => String(t.id) === String(selectedTeacherId)) || null;
  }, [teachers, selectedTeacherId]);

  const selectedGroup = useMemo(() => {
    return teacherGroups.find((g) => String(g.id) === String(selectedGroupId)) || null;
  }, [teacherGroups, selectedGroupId]);

  // ===== auto select default (nếu chưa chọn gì) =====
  useEffect(() => {
    if (!selectedTeacherId && !selectedGroupId) {
      if (teacherGroups.length) setSelectedGroupId(teacherGroups[0].id);
      else if (teachers.length) setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, teacherGroups, selectedTeacherId, selectedGroupId]);

  // ✅ Khi đổi selection: load permissions vào draft
  useEffect(() => {
    // nếu đang chọn group -> load group.permissions
    if (selectedGroup) {
      setDraftPerms(selectedGroup.permissions || {});
      return;
    }
    // nếu đang chọn teacher -> load teacher.permissions
    if (selectedTeacher) {
      setDraftPerms(selectedTeacher.permissions || {});
      return;
    }
    setDraftPerms({});
  }, [selectedGroup?.id, selectedTeacher?.id]); // eslint-disable-line

  // ===== classes list + search + onlyAssigned =====
  const classList = useMemo(() => {
    const s = classQ.trim().toLowerCase();
    let arr = classes;

    if (s) arr = arr.filter((c) => String(c.name || "").toLowerCase().includes(s));

    if (onlyAssigned) {
      arr = arr.filter((c) => {
        const p = draftPerms?.[c.id];
        return p && (p.homework || p.grading || p.students);
      });
    }

    return arr;
  }, [classes, classQ, onlyAssigned, draftPerms]);

  // group theo groupName (Khác/Khối...)
  const groupedClasses = useMemo(() => {
    const map = new Map();
    classList.forEach((c) => {
      const g = c.groupName || "Khác";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(c);
    });
    return Array.from(map.entries()).map(([groupName, items]) => ({ groupName, items }));
  }, [classList]);

  // ===== perms helpers =====
  const toggleOne = (classId, key) => {
    setDraftPerms((prev) => {
      const cur = prev?.[classId] || emptyPerm();
      const next = { ...cur, [key]: !cur[key] };
      return { ...(prev || {}), [classId]: next };
    });
  };

  const setAllForAllClasses = (checked) => {
    const next = {};
    classes.forEach((c) => {
      next[c.id] = checked
        ? { homework: true, grading: true, students: true }
        : { homework: false, grading: false, students: false };
    });
    setDraftPerms(next);
  };

  const allChecked = useMemo(() => {
    if (!classes.length) return false;
    return classes.every((c) => {
      const p = draftPerms?.[c.id] || emptyPerm();
      return p.homework && p.grading && p.students;
    });
  }, [classes, draftPerms]);

  // ✅ Save theo entity đang chọn
  const savePermissions = () => {
    if (selectedGroup) {
      updateTeacherGroupPermissions(String(selectedGroup.id), draftPerms);
      alert("Cấp quyền cho nhóm thành công ✅");
      return;
    }
    if (selectedTeacher) {
      updateTeacherPermissions(String(selectedTeacher.id), draftPerms);
      alert("Cấp quyền thành công ✅");
      return;
    }
  };

  // ===== actions: teacher =====
  const handleDeleteTeacher = (id) => {
    if (!window.confirm("Xóa giáo viên này?")) return;
    deleteTeacher(String(id));
    setTeacherDotsOpenId(null);
    if (String(selectedTeacherId) === String(id)) setSelectedTeacherId(null);
  };

 const handleEditTeacher = (t) => {
    setTeacherDotsOpenId(null)
    setEditingTeacher(t);      // set data để modal fill
    setOpenAddTeacher(true);    // mở modal
  };

  // ===== actions: group =====
  const handleEditGroup = (g) => {
    setEditingGroup(g);
    setOpenAddGroup(true);
    setGroupDotsOpenId(null);
  };

  const handleDeleteGroup = (g) => {
    if (!window.confirm(`Xóa nhóm "${g.name}"?`)) return;
    deleteTeacherGroup(String(g.id));
    setGroupDotsOpenId(null);

    // nếu đang chọn nhóm đó thì clear selection
    if (String(selectedGroupId) === String(g.id)) {
      setSelectedGroupId(null);
    }
  };

  const pickTeacher = (teacherId) => {
    if (!selectedGroup) return;
    addTeacherToGroup(String(selectedGroup.id), String(teacherId));
  };

  return (
    <div className="tp-page">
      {/* LEFT */}
      <aside className="tp-left">
        <div className="tp-left-top">
          <div className="tp-search">
            <input
              type="search"
              name="teacher_search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
              placeholder="Tìm tên, phone hoặc Email"
            />
            <span className="tp-search-ico">🔍</span>
          </div>

          <div className="tp-plus-wrap" ref={plusMenuRef}>
            <button
              type="button"
              className="tp-plus"
              onClick={() => setMenuOpen((v) => !v)}
              title="Thêm"
            >
              <FaPlus />
            </button>

            {menuOpen && (
              <div className="tp-pop" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="tp-pop-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditingTeacher(null);
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
                    setEditingGroup(null);               
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
          {filteredGroups.length === 0 && filteredTeachers.length === 0 ? (
            <div className="tp-empty-left">Chưa có nhóm hoặc giáo viên</div>
          ) : (
            <>
              {/* GROUP LIST */}
              {filteredGroups.length > 0 && (
                <div className="tp-list">
                  {filteredGroups.map((g) => {
                    const active = String(g.id) === String(selectedGroupId);

                    return (
                      <button
                        key={`g-${g.id}`}
                        type="button"
                        className={`tp-item ${active ? "active" : ""} ${
                          String(groupDotsOpenId) === String(g.id) ? "menu-open" : ""
                        }`}
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          setSelectedTeacherId(null);

                          setOpenAddTeacher(false);
                          setOpenPickTeacher(false);

                          setTeacherDotsOpenId(null);
                          setGroupDotsOpenId(null);
                        }}
                      >
                        <div className="tp-avatar">👥</div>

                        <div className="tp-item-info">
                          <div className="tp-item-name">{g.name}</div>
                          <div className="tp-item-sub">{(g.memberIds || []).length} thành viên</div>
                        </div>

                        {/* dots group */}
                        <div
                          className="tp-dots tp-dots-wrap"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupDotsOpenId((cur) =>
                              String(cur) === String(g.id) ? null : g.id
                            );
                            setTeacherDotsOpenId(null);
                          }}
                          title="Tùy chọn"
                        >
                          ⋮
                          {String(groupDotsOpenId) === String(g.id) && (
                            <div
                              className="tp-item-menu"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="tp-menu-btn edit"
                                onClick={() => {
                                  setEditingGroup(g);
                                  setOpenAddGroup(true);
                                  setGroupDotsOpenId(null);
                                }}
                              >
                                ✎ Sửa
                              </button>

                              <button
                                type="button"
                                className="tp-menu-btn del"
                                onClick={() => handleDeleteGroup(g)}
                              >
                                🗑 Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TEACHER LIST */}
              {filteredTeachers.length > 0 && (
                <div className="tp-list">
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
                        key={`t-${t.id}`}
                        type="button"
                        className={`tp-item ${active ? "active" : ""} ${
                          String(teacherDotsOpenId) === String(t.id) ? "menu-open" : ""
                        }`}
                        onClick={() => {
                          setSelectedTeacherId(t.id);
                          setSelectedGroupId(null);

                          setOpenPickTeacher(false);
                          setOpenAddTeacher(false);

                          setTeacherDotsOpenId(null);
                          setGroupDotsOpenId(null);
                        }}
                      >
                        <div className="tp-avatar">{initials || "GV"}</div>

                        <div className="tp-item-info">
                          <div className="tp-item-name">{t.fullName}</div>
                          <div className="tp-item-sub">{t.email}</div>
                        </div>

                        {/* dots teacher */}
                        <div
                          className="tp-dots tp-dots-wrap"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeacherDotsOpenId((cur) =>
                              String(cur) === String(t.id) ? null : t.id
                            );
                            setGroupDotsOpenId(null);
                          }}
                          title="Tùy chọn"
                        >
                          ⋮
                          {String(teacherDotsOpenId) === String(t.id) && (
                            <div
                              className="tp-item-menu"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="tp-menu-btn edit"
                                onClick={() => {
                                  setTeacherDotsOpenId(null);
                                  handleEditTeacher(t);
                                }}
                              >
                                ✎ Sửa
                              </button>

                              <button
                                type="button"
                                className="tp-menu-btn del"
                                onClick={() => handleDeleteTeacher(t.id)}
                              >
                                🗑 Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* RIGHT */}
      <main className="tp-right">
        <div className="tp-right-top">
          <button className="tp-mini" type="button" title="Danh sách">▣</button>
          <div className="tp-right-bar" />
        </div>

        {/* ✅ GROUP MODE: render BOTH panels */}
        {selectedGroup && (
          <div className="tp-right-stack">
            {/* MEMBERS */}
            <div className="tp-panel">
              <div className="tp-panel-head">
                <div className="tp-panel-title">Thành viên trong nhóm: {selectedGroup.name}</div>

                <div className="tp-panel-actions">
                  <button
                    type="button"
                    className="tp-btn primary"
                    onClick={() => alert("Cập nhật nhóm thành công ✅")}
                  >
                    Lưu
                  </button>
                </div>
              </div>

              <div className="tp-members">
                <div className="tp-member tp-add-member">
                  <button
                    type="button"
                    className="tp-member-circle"
                    onClick={() => setOpenPickTeacher(true)}
                    title="Thêm thành viên"
                  >
                    ＋
                  </button>
                  <div className="tp-member-name">Thêm</div>
                </div>

                {(selectedGroup.memberIds || []).map((tid) => {
                  const t = teachers.find((x) => String(x.id) === String(tid));
                  const initials = String(t?.fullName || "GV")
                    .trim()
                    .split(" ")
                    .slice(-2)
                    .map((x) => x[0]?.toUpperCase())
                    .join("")
                    .slice(0, 2);

                  return (
                    <div key={tid} className="tp-member" title={t?.fullName || ""}>
                      <div className="tp-member-circle">{initials || "GV"}</div>
                      <div className="tp-member-name">
                        {(t?.fullName || "GV").split(" ").slice(-1)[0]}
                      </div>
                      <button
                        type="button"
                        className="tp-member-x"
                        onClick={() => removeTeacherFromGroup(String(selectedGroup.id), String(tid))}
                        title="Xóa"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PERMISSIONS (FOR GROUP) */}
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
                    onClick={() => setDraftPerms(selectedGroup.permissions || {})}
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
                {groupedClasses.map((g) => (
                  <div key={g.groupName} className="tp-group">
                    <div className="tp-group-head">
                      <div className="tp-group-title">{g.groupName}</div>
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
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ✅ TEACHER MODE: only permissions */}
        {!selectedGroup && selectedTeacher && (
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
              {groupedClasses.map((g) => (
                <div key={g.groupName} className="tp-group">
                  <div className="tp-group-head">
                    <div className="tp-group-title">{g.groupName}</div>
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
              ))}
            </div>
          </div>
        )}

        {!selectedGroup && !selectedTeacher && (
          <div className="tp-empty-right">
            <div className="tp-box">📦</div>
            <div className="tp-empty-text">Chưa có dữ liệu</div>
          </div>
        )}

        {/* MODALS */}
        <AddTeacherModal
          open={openAddTeacher}
          editingTeacher={editingTeacher}
          onClose={() => {
            setOpenAddTeacher(false);
            setEditingTeacher(null);
          }}
          onCreated={(newId) => {
            setSelectedTeacherId(newId);
            setSelectedGroupId(null);
            setOpenAddTeacher(false);
            setEditingTeacher(null);
          }}
          onUpdated={(id) => {
            setSelectedTeacherId(id);
            setOpenAddTeacher(false);
            setEditingTeacher(null);
          }}
        />

        <SelectTeachersModal
          open={openPickTeacher}
          onClose={() => setOpenPickTeacher(false)}
          teachers={teachers}
          pickedIds={selectedGroup?.memberIds || []}
          onPick={(teacherId) => pickTeacher(teacherId)}
        />
        <AddTeacherGroupModal
          open={openAddGroup}
          editingGroup={editingGroup}
          onClose={() => { setOpenAddGroup(false); setEditingGroup(null); }}
          onCreate={(name) => {
            if (editingGroup?.id) return updateTeacherGroup(String(editingGroup.id), { name });
            return addTeacherGroup(name);
          }}
        />

      </main>
    </div>
  );
}
