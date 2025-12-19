// src/pages/ClassPages/CreateClassModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./CreateClassModal.css";
import { useClassStore } from "../../context/ClassContext";

function parseYearStartFromSchoolYear(schoolYear) {
  if (!schoolYear) return 2024;
  const m = String(schoolYear).match(/\d{4}/);
  return m ? Number(m[0]) : 2024;
}

export default function CreateClassModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  editingClass,
}) {
  const years = useMemo(() => [2021, 2022, 2023, 2024, 2025, 2026], []);
  const modalRef = useRef(null);

  // ✅ global groups
  const { groups, addGroup, deleteGroup } = useClassStore();

  const [className, setClassName] = useState("");
  const [yearStart, setYearStart] = useState(2024);
  const [yearOpen, setYearOpen] = useState(false);

  // ✅ chọn theo groupId (từ global list)
  const [selectedGroupId, setSelectedGroupId] = useState("khac");

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMsg, setGroupMsg] = useState("");

  const isEditing = !!editingClass;
  const didInitRef = useRef(false);


  useEffect(() => {
  if (!open) { didInitRef.current = false; return; }

  
  if (didInitRef.current && !editingClass) return;

  setYearOpen(false);
  setShowAddGroup(false);
  setGroupName("");
  setGroupMsg("");

  if (editingClass) {
    setClassName(editingClass.name || "");
    setYearStart(parseYearStartFromSchoolYear(editingClass.schoolYear));

    const gName = String(editingClass.groupName || "Khác").trim() || "Khác";
    const found =
      (groups || []).find((g) => g.name.toLowerCase() === gName.toLowerCase()) ||
      (groups || []).find((g) => g.id === "khac");

    setSelectedGroupId(found?.id || "khac");
  } else {
    setClassName("");
    setYearStart(2024);
    setSelectedGroupId("khac");
  }

  didInitRef.current = true;
}, [open, editingClass, groups]);


  if (!open) return null;

  const yearLabel = `${yearStart} - ${yearStart + 1}`;
  const canCreateGroup = groupName.trim().length > 0;

  const close = () => {
    setClassName("");
    setYearStart(2024);
    setSelectedGroupId("khac");
    setYearOpen(false);
    setShowAddGroup(false);
    setGroupName("");
    setGroupMsg("");
    onClose?.();
  };

  const handleCreateGroup = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!canCreateGroup) return;
    const res = addGroup?.(groupName.trim());

    if (res?.ok && res?.group?.id) {
      
      setSelectedGroupId(res.group.id);
      setGroupName("");
      setGroupMsg("Thêm nhóm thành công");
    }
  };

  const handleDeleteGroup = (id) => {
    if (id === "khac") return;
    deleteGroup?.(id);
    if (selectedGroupId === id) setSelectedGroupId("khac");
  };

  const handleSave = (closeAfter) => {
    if (!className.trim()) {
      alert("Vui lòng nhập Tên lớp");
      return;
    }

    const selected = (groups || []).find((g) => g.id === selectedGroupId);
    const selectedName = selected?.name || "Khác";

    const payload = {
      name: className.trim(),
      schoolYear: `${yearStart} - ${yearStart + 1}`,
      groupName: selectedName, // ✅ lưu groupName vào class
    };

    const result = isEditing ? onUpdate?.(payload) : onCreate?.(payload);

    if (result?.ok) {
      if (closeAfter) close();
      else alert(isEditing ? "Đã cập nhật lớp thành công!" : "Đã tạo lớp thành công!");
    }
  };

  return (
    <div className="ccm-overlay" onMouseDown={close}>
      <div
        className="ccm-modal"
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ccm-head">{isEditing ? "Sửa lớp học" : "Thêm lớp học"}</div>

        <div className="ccm-body">
          <label className="ccm-label">Tên lớp</label>
          <input
            className="ccm-input"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Nhập tên lớp"
          />

          <label className="ccm-label">Năm học</label>
          <div className="ccm-year">
            <button
              type="button"
              className="ccm-year-btn"
              onClick={() => setYearOpen((v) => !v)}
            >
              <span>{yearLabel}</span>
              <span className="ccm-caret">⌄</span>
            </button>

            {yearOpen && (
              <div className="ccm-year-menu">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={`ccm-year-item ${y === yearStart ? "active" : ""}`}
                    onClick={() => {
                      setYearStart(y);
                      setYearOpen(false);
                    }}
                  >
                    {y} - {y + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ccm-group-box">
            <div className="ccm-group-head">Chọn nhóm lớp</div>

            <div className="ccm-group-list">
              {(groups || []).map((g) => (
                <div key={g.id} className="ccm-group-item">
                  <label className="ccm-radio">
                    <input
                      type="radio"
                      name="group"
                      checked={selectedGroupId === g.id}
                      onChange={() => setSelectedGroupId(g.id)}
                    />
                    <span>{g.name}</span>
                  </label>

                  {g.id !== "khac" && (
                    <button
                      type="button"
                      className="ccm-trash"
                      title="Xóa nhóm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteGroup(g.id);
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="ccm-add-group"
              onClick={() => setShowAddGroup(true)}
            >
              + Thêm nhóm
            </button>

            {showAddGroup && (
              <div className="ccm-add-group-row">
                <input
                  className="ccm-add-group-input"
                  placeholder="Tên nhóm. VD: Khối 1..."
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setGroupMsg("");
                  }}
                />

                <button
                  type="button"
                  className={`ccm-create-group-btn ${canCreateGroup ? "" : "disabled"}`}
                  onClick={handleCreateGroup}
                  disabled={!canCreateGroup}
                >
                  Tạo nhóm
                </button>

                <button
                  type="button"
                  className="ccm-close-mini"
                  onClick={() => {
                    setShowAddGroup(false);
                    setGroupName("");
                    setGroupMsg("");
                  }}
                  title="Đóng"
                >
                  ✕
                </button>

                {groupMsg && <div className="ccm-group-msg">{groupMsg}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="ccm-footer">
          <button type="button" className="ccm-btn ccm-cancel" onClick={close}>
            Hủy
          </button>

          <button type="button" className="ccm-btn ccm-save" onClick={() => handleSave(false)}>
            {isEditing ? "Cập nhật" : "Lưu"}
          </button>

          <button
            type="button"
            className="ccm-btn ccm-save-close"
            onClick={() => handleSave(true)}
          >
            {isEditing ? "Cập nhật và đóng" : "Lưu và đóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
