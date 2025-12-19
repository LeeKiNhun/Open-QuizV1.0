// src/pages/ClassPages/AddStudentModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { useClassStore } from "../../context/ClassContext";
import "./AddStudentModal.css";


export default function AddStudentModal({ open, onClose, classId, editingStudent = null }) {
  const { addStudent, updateStudent } = useClassStore();

  const isEdit = !!editingStudent?.id;

  const [tab, setTab] = useState("form"); // form | excel (excel chỉ dùng khi add)
  const [fullName, setFullName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [gender, setGender] = useState("Nữ");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showErr, setShowErr] = useState(false);

  const fileRef = useRef(null);

  // Khi mở modal: nếu edit -> fill data; nếu add -> reset
  useEffect(() => {
    if (!open) return;

    setShowErr(false);

    if (isEdit) {
      setTab("form"); // edit không dùng excel
      setFullName(editingStudent.fullName || "");
      setStudentCode(editingStudent.studentCode || "");
      setGender(editingStudent.gender || "Nữ");
      setDob(editingStudent.dob || "");
      setPhone(editingStudent.phone || "");
      setParentPhone(editingStudent.parentPhone || "");
      setEmail(editingStudent.email || "");
    } else {
      setTab("form");
      setFullName("");
      setStudentCode("");
      setGender("Nữ");
      setDob("");
      setPhone("");
      setParentPhone("");
      setEmail("");
    }
  }, [open, isEdit, editingStudent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const close = () => {
    onClose?.();
  };

  const onConfirm = () => {
    if (!fullName.trim()) {
      setShowErr(true);
      return;
    }
    if (!classId) {
      alert("Thiếu classId, không thể lưu học sinh.");
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      studentCode: studentCode.trim(),
      gender,
      dob,
      phone: phone.trim(),
      parentPhone: parentPhone.trim(),
      email: email.trim(),
    };

    if (isEdit) {
      // ✅ Edit: giữ nguyên id/studentId/createdAt, chỉ update các field thay đổi
      updateStudent(String(classId), String(editingStudent.id), payload);
    } else {
      // ✅ Add: tạo mới
      addStudent(String(classId), {
        id: `st-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...payload,
        createdAt: new Date().toISOString(),
        studentId: Math.floor(10000000 + Math.random() * 90000000).toString(),
      });
    }

    close();
  };

  return (
    <div className="asm-overlay" onMouseDown={close}>
      <div className="asm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="asm-tabs">
          <button
            className={`asm-tab ${tab === "form" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("form")}
          >
            {isEdit ? "Sửa Học Sinh" : "Thêm Học Sinh"}
          </button>

          {!isEdit && (
            <button
              className={`asm-tab ${tab === "excel" ? "active" : ""}`}
              type="button"
              onClick={() => setTab("excel")}
            >
              Thêm nhanh bằng file excel
            </button>
          )}
        </div>

        <div className="asm-body">
          {tab === "form" ? (
            <>
             <input
                className="asm-input"
                type="text"
                name="student-fullname"           
                autoComplete="name"               
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                />
              {showErr && <div className="asm-err">Vui lòng nhập họ và tên.</div>}

            <input
                className="asm-input"
                type="text"
                name="student-code"               // ← THÊM
                autoComplete="off"                // ← THÊM
                placeholder="Số báo danh"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                />

              <div className="asm-row">
                <div className="asm-label">Giới tính</div>
                <label className="asm-radio">
                  <input
                    type="radio"
                    checked={gender === "Nam"}
                    onChange={() => setGender("Nam")}
                  />
                  Nam
                </label>
                <label className="asm-radio">
                  <input
                    type="radio"
                    checked={gender === "Nữ"}
                    onChange={() => setGender("Nữ")}
                  />
                  Nữ
                </label>
              </div>

              <input
                className="asm-input"
                type="date"                       // ← SỬA từ type="text"
                name="student-dob"                // ← THÊM
                autoComplete="bday"               // ← THÊM
                placeholder="Ngày sinh"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                />

             <input
                className="asm-input"
                type="tel"                        // ← SỬA từ type="text"
                name="student-phone"              // ← THÊM
                autoComplete="tel"                // ← THÊM
                placeholder="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                />

             <input
                className="asm-input"
                type="tel"                        // ← SỬA
                name="parent-phone"               // ← THÊM
                autoComplete="off"                // ← THÊM
                placeholder="Số điện thoại phụ huynh"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                />

              <input
                className="asm-input"
                type="email"                     
                name="student-email"              
                autoComplete="email"              
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </>
          ) : (
            <div className="asm-excel">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={() => {}}
              />
              <button
                className="asm-drop"
                type="button"
                onClick={() => fileRef.current?.click()}
              >
                📗 Kéo thả file Excel hoặc Click để chọn file
              </button>
            </div>
          )}
        </div>

        <div className="asm-footer">
          <button className="asm-btn asm-cancel" type="button" onClick={close}>
            Hủy
          </button>
          <button className="asm-btn asm-ok" type="button" onClick={onConfirm}>
            {isEdit ? "Lưu thay đổi" : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
