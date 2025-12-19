// src/context/ClassContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ClassContext = createContext(null);

const STORAGE_CLASSES = "openquiz_classes";
const STORAGE_GROUPS = "openquiz_groups";

// ✅ thêm 2 key mới
const STORAGE_TEACHERS = "openquiz_teachers";
const STORAGE_TEACHER_GROUPS = "openquiz_teacher_groups";

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function toSchoolYearFromYearStart(yearStart) {
  const y = Number(yearStart);
  if (!Number.isFinite(y)) return "";
  return `${y} - ${y + 1}`;
}

function migrateClass(c) {
  if (!c || typeof c !== "object") return null;

  const id = String(c.id ?? `class-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const name = String(c.name || c.className || "Lớp chưa đặt tên");

  let schoolYear = "";
  if (typeof c.schoolYear === "string" && c.schoolYear.trim()) schoolYear = c.schoolYear.trim();
  else if (c.yearStart != null) schoolYear = toSchoolYearFromYearStart(c.yearStart);

  let groupName = "Khác";
  if (typeof c.groupName === "string" && c.groupName.trim()) groupName = c.groupName.trim();
  else if (Array.isArray(c.groups) && c.groups.length) groupName = String(c.groups[0] || "").trim() || "Khác";

  const students = Array.isArray(c.students) ? c.students : [];

  return {
    id,
    name,
    schoolYear,
    groupName,
    students,
    createdAt: c.createdAt || new Date().toISOString(),
  };
}

function ensureDefaultGroups(list) {
  const groups = Array.isArray(list) ? list : [];
  const cleaned = groups
    .filter(Boolean)
    .map((g) => ({ id: String(g.id || ""), name: String(g.name || "").trim() }))
    .filter((g) => g.id && g.name);

  const hasKhac = cleaned.some((g) => g.id === "khac");
  return hasKhac ? cleaned : [{ id: "khac", name: "Khác" }, ...cleaned];
}

// ✅ teacher migrate
function migrateTeacher(t) {
  if (!t || typeof t !== "object") return null;
  return {
    id: String(t.id ?? `t-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    fullName: String(t.fullName || t.name || "").trim(),
    phone: String(t.phone || "").trim(),
    email: String(t.email || "").trim(),
    permissions: t.permissions && typeof t.permissions === "object" ? t.permissions : {},
    createdAt: t.createdAt || new Date().toISOString(),
  };
}

// ✅ group migrate
function migrateTeacherGroup(g) {
  if (!g || typeof g !== "object") return null;
  return {
    id: String(g.id ?? `tg-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: String(g.name || "").trim() || "Nhóm chưa đặt tên",
    memberIds: Array.isArray(g.memberIds) ? g.memberIds.map(String) : [],
    // ✅ permissions theo lớp (giống teacher.permissions)
    permissions: g.permissions && typeof g.permissions === "object" ? g.permissions : {},
    createdAt: g.createdAt || new Date().toISOString(),
  };
}


export function ClassProvider({ children }) {
  // groups global
  const [groups, setGroups] = useState(() => {
    const raw = localStorage.getItem(STORAGE_GROUPS);
    return ensureDefaultGroups(safeParse(raw, [{ id: "khac", name: "Khác" }]));
  });

  // classes
  const [classes, setClasses] = useState(() => {
    const raw = localStorage.getItem(STORAGE_CLASSES);
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed.map(migrateClass).filter(Boolean) : [];
  });

  // ✅ teachers
  const [teachers, setTeachers] = useState(() => {
    const raw = localStorage.getItem(STORAGE_TEACHERS);
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed.map(migrateTeacher).filter(Boolean) : [];
  });

  // ✅ teacher groups
  const [teacherGroups, setTeacherGroups] = useState(() => {
    const raw = localStorage.getItem(STORAGE_TEACHER_GROUPS);
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed.map(migrateTeacherGroup).filter(Boolean) : [];
  });

  // sync LS
  useEffect(() => localStorage.setItem(STORAGE_CLASSES, JSON.stringify(classes)), [classes]);
  useEffect(() => localStorage.setItem(STORAGE_GROUPS, JSON.stringify(groups)), [groups]);
  useEffect(() => localStorage.setItem(STORAGE_TEACHERS, JSON.stringify(teachers)), [teachers]);
  useEffect(
    () => localStorage.setItem(STORAGE_TEACHER_GROUPS, JSON.stringify(teacherGroups)),
    [teacherGroups]
  );

  // ===== GROUPS GLOBAL ACTIONS =====
  const addGroup = (name) => {
    const clean = String(name || "").trim();
    if (!clean) return { ok: false };
    if (clean.toLowerCase() === "khác") return { ok: true, group: { id: "khac", name: "Khác" } };

    const exists = groups.find((g) => g.name.toLowerCase() === clean.toLowerCase());
    if (exists) return { ok: true, group: exists };

    const newG = { id: `g-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: clean };
    setGroups((prev) => [...prev, newG]);
    return { ok: true, group: newG };
  };

  const deleteGroup = (groupId) => {
    if (String(groupId) === "khac") return;
    const g = groups.find((x) => String(x.id) === String(groupId));
    const name = g?.name;

    setGroups((prev) => (prev || []).filter((x) => String(x.id) !== String(groupId)));

    if (name) {
      setClasses((prev) =>
        (prev || []).map((c) =>
          String(c.groupName || "").toLowerCase() === String(name).toLowerCase()
            ? { ...c, groupName: "Khác" }
            : c
        )
      );
    }
  };

  // ===== CLASS ACTIONS =====
  const addClass = (data) => {
    const newClass = {
      id: `class-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: String(data?.name || "").trim(),
      schoolYear: String(data?.schoolYear || "").trim(),
      groupName: String(data?.groupName || "Khác").trim() || "Khác",
      students: [],
      createdAt: new Date().toISOString(),
    };
    setClasses((prev) => [newClass, ...(prev || [])]);
    return { ok: true, class: newClass };
  };

  const updateClass = (classId, data) => {
    setClasses((prev) =>
      (prev || []).map((c) =>
        String(c.id) !== String(classId)
          ? c
          : {
              ...c,
              name: data?.name != null ? String(data.name).trim() : c.name,
              schoolYear: data?.schoolYear != null ? String(data.schoolYear).trim() : c.schoolYear,
              groupName:
                data?.groupName != null ? String(data.groupName).trim() || "Khác" : c.groupName,
            }
      )
    );
    return { ok: true };
  };

  const deleteClass = (classId) => {
    setClasses((prev) => (prev || []).filter((c) => String(c.id) !== String(classId)));
  };

  const addStudent = (classId, student) => {
    setClasses((prev) =>
      (prev || []).map((c) => {
        if (String(c.id) !== String(classId)) return c;
        const s = {
          id: student?.id ?? `st-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: student?.createdAt || new Date().toISOString(),
          ...student,
        };
        return { ...c, students: [...(c.students || []), s] };
      })
    );
  };

  const updateStudent = (classId, studentId, patch) => {
    setClasses((prev) =>
      (prev || []).map((c) => {
        if (String(c.id) !== String(classId)) return c;
        return {
          ...c,
          students: (c.students || []).map((s) =>
            String(s.id) === String(studentId) ? { ...s, ...patch } : s
          ),
        };
      })
    );
  };

  const removeStudent = (classId, studentId) => {
    setClasses((prev) =>
      (prev || []).map((c) => {
        if (String(c.id) !== String(classId)) return c;
        return { ...c, students: (c.students || []).filter((s) => String(s.id) !== String(studentId)) };
      })
    );
  };

  // ==========================
  // ✅ TEACHERS ACTIONS
  // ==========================
 const normalizeEmail = (v) => String(v || "").trim().toLowerCase();

const addTeacher = ({ fullName, phone, email }) => {
  const cleanEmail = normalizeEmail(email);

  // ✅ chặn trùng email
  const exists = (teachers || []).some((x) => normalizeEmail(x.email) === cleanEmail);
  if (exists) return { ok: false, message: "Email đã tồn tại" };

  const t = {
    id: `t-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fullName: String(fullName || "").trim(),
    phone: String(phone || "").trim(),
    email: cleanEmail, 
    permissions: {},
    createdAt: new Date().toISOString(),
  };

  setTeachers((prev) => [t, ...(prev || [])]);
  return { ok: true, id: t.id, teacher: t };
};

const updateTeacher = (teacherId, patch) => {
  const nextEmail = patch?.email != null ? normalizeEmail(patch.email) : null;

  
    if (nextEmail) {
      const exists = (teachers || []).some(
        (x) => String(x.id) !== String(teacherId) && normalizeEmail(x.email) === nextEmail
      );
      if (exists) return { ok: false, message: "Email đã tồn tại" };
    }

    setTeachers((prev) =>
      (prev || []).map((t) =>
        String(t.id) === String(teacherId)
          ? {
              ...t,
              ...patch,
              ...(nextEmail ? { email: nextEmail } : {}),
            }
          : t
      )
    );

    return { ok: true };
  };


  const deleteTeacher = (teacherId) => {
    setTeachers((prev) => (prev || []).filter((t) => String(t.id) !== String(teacherId)));

    // ✅ remove khỏi nhóm
    setTeacherGroups((prev) =>
      (prev || []).map((g) => ({
        ...g,
        memberIds: (g.memberIds || []).filter((id) => String(id) !== String(teacherId)),
      }))
    );
  };

  const updateTeacherPermissions = (teacherId, perms) => {
    setTeachers((prev) =>
      (prev || []).map((t) =>
        String(t.id) === String(teacherId) ? { ...t, permissions: perms || {} } : t
      )
    );
  };

  // ==========================
  // ✅ TEACHER GROUPS ACTIONS: tạo nhóm + thêm/xóa member
  // ==========================
  const addTeacherGroup = (name) => {
    const clean = String(name || "").trim();
    if (!clean) return { ok: false };
    const newG = {
      id: `tg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: clean,
      memberIds: [],
      permissions: {},
      createdAt: new Date().toISOString(),
    };
    setTeacherGroups((prev) => [newG, ...(prev || [])]);
    return { ok: true, group: newG };
  };


  const addTeacherToGroup = (groupId, teacherId) => {
    setTeacherGroups((prev) =>
      (prev || []).map((g) => {
        if (String(g.id) !== String(groupId)) return g;
        const cur = Array.isArray(g.memberIds) ? g.memberIds.map(String) : [];
        if (cur.includes(String(teacherId))) return g;
        return { ...g, memberIds: [...cur, String(teacherId)] };
      })
    );
  };

  const removeTeacherFromGroup = (groupId, teacherId) => {
    setTeacherGroups((prev) =>
      (prev || []).map((g) => {
        if (String(g.id) !== String(groupId)) return g;
        return {
          ...g,
          memberIds: (g.memberIds || []).filter((id) => String(id) !== String(teacherId)),
        };
      })
    );
  };

  const updateTeacherGroup = (groupId, patch) => {
    const gid = String(groupId);
    const name = patch?.name != null ? String(patch.name).trim() : null;

    setTeacherGroups((prev) =>
      (prev || []).map((g) =>
        String(g.id) !== gid
          ? g
          : {
              ...g,
              ...(patch || {}),
              name: name != null ? (name || "Nhóm chưa đặt tên") : g.name,
            }
      )
    );
    return { ok: true };
  };

  const deleteTeacherGroup = (groupId) => {
    const gid = String(groupId);
    setTeacherGroups((prev) => (prev || []).filter((g) => String(g.id) !== gid));
    return { ok: true };
  };

  const updateTeacherGroupPermissions = (groupId, perms) => {
    const gid = String(groupId);
    setTeacherGroups((prev) =>
      (prev || []).map((g) =>
        String(g.id) === gid ? { ...g, permissions: perms || {} } : g
      )
    );
    return { ok: true };
  };


  const value = useMemo(
    () => ({
      classes,
      groups,
      teachers,
      teacherGroups,

      addGroup,
      deleteGroup,
      addClass,
      updateClass,
      deleteClass,

      addStudent,
      updateStudent,
      removeStudent,

      addTeacher,
      updateTeacher,
      deleteTeacher,
      updateTeacherPermissions,

      addTeacherGroup,
      updateTeacherGroup,
      deleteTeacherGroup,
      updateTeacherGroupPermissions,
      addTeacherToGroup,
      removeTeacherFromGroup,

      setClasses,
      setGroups,
      setTeachers,
      setTeacherGroups,
    }),
    [classes, groups, teachers, teacherGroups]
  );

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
}

export function useClassStore() {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error("useClassStore must be used within ClassProvider");
  return ctx;
}
