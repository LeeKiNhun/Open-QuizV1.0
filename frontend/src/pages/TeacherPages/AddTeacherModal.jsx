import React, { useEffect, useMemo, useState } from "react";
import { useClassStore } from "../../context/ClassContext";
import "./AddTeacherModal.css";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
const normalizePhoneDigits = (v) => String(v || "").replace(/[^\d]/g, "");
const isValidPhone = (phone) => {
  const digits = normalizePhoneDigits(phone);
  return digits.length >= 9 && digits.length <= 15;
};


export default function AddTeacherModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  editingTeacher, 
}) {
  const { addTeacher, updateTeacher } = useClassStore();
  const isEditing = !!editingTeacher;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [serverErr, setServerErr] = useState("");
  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setTouched({ name: false, phone: false, email: false });
  };

  
  useEffect(() => {
    if (!open) return;

    if (editingTeacher) {
      setFullName(editingTeacher.fullName || "");
      setPhone(editingTeacher.phone || "");
      setEmail(editingTeacher.email || "");
      setTouched({ name: false, phone: false, email: false });
    } else {
      resetForm(); 
    }
    
  }, [open, editingTeacher?.id]);

  const errors = useMemo(() => {
    const e = {};
    if (!fullName.trim()) e.name = "Vui lòng nhập tên giáo viên.";
    if (!phone.trim()) e.phone = "Vui lòng nhập số điện thoại.";
    else if (!isValidPhone(phone)) e.phone = "Số điện thoại không hợp lệ (tối thiểu 9 số).";
    if (!email.trim()) e.email = "Vui lòng nhập email.";
    else if (!isValidEmail(email)) e.email = "Email không hợp lệ.";
    return e;
  }, [fullName, phone, email]);

  const canSave = Object.keys(errors).length === 0;

  if (!open) return null;

  const close = () => {
    resetForm();    
    onClose?.();
  };

  const save = () => {
    setTouched({ name: true, phone: true, email: true });
    if (!canSave) return;

    if (isEditing) {
  const rs = updateTeacher?.(String(editingTeacher.id), { fullName, phone, email });
    if (rs?.ok === false) return setServerErr(rs.message || "Email đã tồn tại.");
    onUpdated?.(editingTeacher.id); close(); return;
    }
    const rs = addTeacher?.({ fullName, phone, email });
    if (rs?.ok === false) return setServerErr(rs.message || "Email đã tồn tại.");
    onCreated?.(rs?.id || rs?.teacher?.id); close();

  };

  return (
    <div className="tm-overlay" onMouseDown={close}>
      <div className="tm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tm-head">{isEditing ? "Sửa giáo viên" : "Thêm giáo viên"}</div>

        <div className="tm-body">
          <div>
            <input
              className="tm-input"
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            />
            {touched.name && errors.name && <div className="tm-err">{errors.name}</div>}
          </div>

          <div>
            <input
              className="tm-input"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
            />
            {touched.phone && errors.phone && <div className="tm-err">{errors.phone}</div>}
          </div>

          <div>
            <input
              className="tm-input"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setServerErr(""); }}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            />
            {touched.email && errors.email && <div className="tm-err">{errors.email}</div>}
            {serverErr && <div className="tm-err">{serverErr}</div>}
          </div>
        </div>

        <div className="tm-foot">
          <button type="button" className="tm-btn cancel" onClick={close}>
            Hủy
          </button>
          <button type="button" className="tm-btn ok" onClick={save} disabled={!canSave}>
            {isEditing ? "Cập nhật" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
