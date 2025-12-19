// src/pages/CreateHomeWork.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createHomework } from "../api/homeworkApi";
import { useClassStore } from "../context/ClassContext";
import "./CreateHomeWork.css";

export default function CreateHomeWork() {
  const navigate = useNavigate();
  const { classes } = useClassStore(); // ✅ Lấy classes từ Context

  const [isDarkMode] = useState(false);

  const [name, setName] = useState("");
  const [touchedName, setTouchedName] = useState(false);

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [allowViewResult, setAllowViewResult] = useState(false);
  
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  // ✅ Quản lý chọn lớp
  const [classQ, setClassQ] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState(new Set());
  const [touchedClasses, setTouchedClasses] = useState(false);

  // ✅ Lọc classes theo từ khóa tìm kiếm
  const filteredClasses = useMemo(() => {
    const kw = classQ.trim().toLowerCase();
    if (!kw) return classes;
    return classes.filter(c => (c.name || "").toLowerCase().includes(kw));
  }, [classes, classQ]);

  // ✅ Nhóm classes theo groupName
  const groupedClasses = useMemo(() => {
    const map = new Map();
    filteredClasses.forEach(c => {
      const g = c.groupName || "Khác";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(c);
    });
    return Array.from(map.entries()).map(([groupName, items]) => ({ 
      groupName, 
      items 
    }));
  }, [filteredClasses]);

  const rootClass = useMemo(
    () => `chw-layout ${isDarkMode ? "dark-mode" : ""}`,
    [isDarkMode]
  );

  // ✅ Toggle chọn lớp
  const toggleClass = (id) => {
    setSelectedClassIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ✅ Chọn/bỏ chọn tất cả lớp đang hiển thị
  const allVisibleChecked = filteredClasses.length > 0
    && filteredClasses.every(c => selectedClassIds.has(c.id));

  const toggleAllVisible = () => {
    if (allVisibleChecked) {
      // Bỏ chọn tất cả
      setSelectedClassIds(prev => {
        const next = new Set(prev);
        filteredClasses.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      // Chọn tất cả
      setSelectedClassIds(prev => {
        const next = new Set(prev);
        filteredClasses.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const handleResetTime = () => {
    setStartAt("");
    setEndAt("");
  };

  const handlePickFile = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e) => {
    const picked = e.target.files?.[0] || null;
    setFile(picked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedName(true);
    setTouchedClasses(true);

    // ✅ Validate
    if (!name.trim()) {
      alert("Vui lòng nhập tên bài tập");
      return;
    }

    if (selectedClassIds.size === 0) {
      alert("Vui lòng chọn ít nhất 1 lớp");
      return;
    }

    try {
      // ✅ Tạo FormData
      const fd = new FormData();
      fd.append("title", name.trim());
      fd.append("classIds", JSON.stringify(Array.from(selectedClassIds)));

      if (startAt) fd.append("dueFrom", new Date(startAt).toISOString());
      if (endAt) fd.append("dueTo", new Date(endAt).toISOString());
      if (allowViewResult) fd.append("allowViewResult", "1");
      if (file) fd.append("file", file);

      // ✅ Debug - xem data gửi đi
      console.log("📤 Sending:", {
        title: fd.get("title"),
        classIds: fd.get("classIds"),
        file: fd.get("file")?.name,
      });

      // ✅ Gọi API - createHomework trả về { item: {...} }
      // homeworkApi.js đã xử lý: return data.item || data;
      const homework = await createHomework(fd);
      
      console.log("✅ API Response:", homework);

      // ✅ Lấy thông tin từ homework object
      const homeworkId = homework?._id || homework?.id;
      const shareCode = homework?.shareCode || "";
      const shareUrl = homework?.shareUrl || "";
      const title = homework?.title || name;

      // ✅ Map tên lớp từ ClassContext
      const selectedClasses = classes.filter(c => selectedClassIds.has(c.id));
      const classNames = selectedClasses.map(c => c.name).join(", ");

      console.log("📋 Created homework:", {
        homeworkId,
        title,
        shareUrl,
        shareCode,
        classIds: Array.from(selectedClassIds),
        classNames,
      });

      // ✅ Hiển thị thông báo thành công
      alert(`✅ Tạo bài tập thành công!\n\nTên: ${title}\nSố lớp: ${selectedClassIds.size}\nLink: ${shareUrl}`);

      // ✅ Chuyển về danh sách bài tập
      navigate("/baitap/xuatban", {
        replace: true,
        state: {
          homeworkId,
          title,
          shareUrl,
          shareCode,
          classIds: Array.from(selectedClassIds),
          classNames,
        },
      });

    } catch (err) {
      console.error("❌ Error:", err);
      
      // ✅ Xử lý error từ Axios
      let errorMessage = "Không thể tạo bài tập.";
      
      if (err.response) {
        // Server trả về lỗi (4xx, 5xx)
        console.error("❌ Status:", err.response.status);
        console.error("❌ Data:", err.response.data);
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        // Không nhận được response
        console.error("❌ No response");
        errorMessage = "Không thể kết nối tới server. Vui lòng kiểm tra backend.";
      } else if (err.code === "NETWORK_ERROR") {
        errorMessage = err.message;
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      alert(errorMessage);
    }
  };

  const showNameError = touchedName && !name.trim();
  const showClassError = touchedClasses && selectedClassIds.size === 0;

  return (
    <div className={rootClass}>
      {/* HEADER */}
      <div className="chw-header">
        <button className="chw-back" type="button" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h2>Tạo bài tập mới</h2>
      </div>

      {/* FORM */}
      <form className="chw-card" onSubmit={handleSubmit}>
        {/* TÊN */}
        <div className="chw-field">
          <label htmlFor="hw-name">
            Tên bài tập <span className="chw-required">*</span>
          </label>
          <input
            id="hw-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouchedName(true)}
            placeholder="Nhập tên bài tập"
          />
          {showNameError && (
            <span className="chw-error">Vui lòng nhập tên bài tập</span>
          )}
        </div>

        {/* THỜI GIAN */}
        <div className="chw-field">
          <label>Thời gian nộp bài</label>
          <div className="chw-time">
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <span aria-hidden="true">→</span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
            <button type="button" className="chw-reset" onClick={handleResetTime}>
              Đặt lại
            </button>
          </div>
        </div>

        {/* FILE */}
        <div className="chw-field">
          <label>Nội dung bài tập</label>

          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
          />

          <button type="button" className="chw-upload" onClick={handlePickFile}>
            ＋ Thêm file bài tập
          </button>

          <div className="chw-editor">
            {file ? (
              <>
                <div>
                  <b>Đã chọn:</b> {file.name}
                </div>
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  Dung lượng: {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </>
            ) : (
              "Chưa có file nào được tải lên"
            )}
          </div>
        </div>

        {/* RADIO */}
        <div className="chw-field">
          <label>Cho phép xem kết quả</label>
          <div className="chw-radio">
            <label>
              <input
                type="radio"
                name="kq"
                checked={!allowViewResult}
                onChange={() => setAllowViewResult(false)}
              />
              Không
            </label>
            <label>
              <input
                type="radio"
                name="kq"
                checked={allowViewResult}
                onChange={() => setAllowViewResult(true)}
              />
              Có
            </label>
          </div>
        </div>
        {/* ✅ CHỌN LỚP */}
        <div className="chw-field">
          <label>
            Chọn lớp <span className="chw-required">*</span>
          </label>

          {/* Tìm kiếm */}
          <div className="chw-class-search">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm lớp..."
              value={classQ}
              onChange={(e) => setClassQ(e.target.value)}
            />
          </div>

          {/* Checkbox chọn tất cả */}
          {filteredClasses.length > 0 && (
            <div className="chw-select-all">
              <label>
                <input
                  type="checkbox"
                  checked={allVisibleChecked}
                  onChange={toggleAllVisible}
                />
                <strong>
                  Chọn tất cả ({filteredClasses.length} lớp)
                </strong>
              </label>
            </div>
          )}

          {/* Danh sách lớp theo nhóm */}
          <div className="chw-class-list">
            {groupedClasses.length === 0 && (
              <div className="chw-empty-class">
                {classQ ? "Không tìm thấy lớp nào" : "Chưa có lớp nào"}
              </div>
            )}

            {groupedClasses.map(({ groupName, items }) => (
              <div key={groupName} className="chw-class-group">
                <div className="chw-group-name">{groupName}</div>
                <div className="chw-group-items">
                  {items.map((cls) => (
                    <label key={cls.id} className="chw-class-item">
                      <input
                        type="checkbox"
                        checked={selectedClassIds.has(cls.id)}
                        onChange={() => toggleClass(cls.id)}
                      />
                      <div className="chw-class-info">
                        <div className="chw-class-name">{cls.name}</div>
                        <div className="chw-class-meta">
                          {cls.schoolYear && (
                            <span className="chw-class-year">
                              📅 {cls.schoolYear}
                            </span>
                          )}
                          <span className="chw-class-count">
                            👥 {cls.students?.length || 0} học sinh
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hiển thị số lớp đã chọn */}
          <div className="chw-selected-count">
            Đã chọn: <strong>{selectedClassIds.size}</strong> lớp
          </div>

          {showClassError && (
            <span className="chw-error">Vui lòng chọn ít nhất 1 lớp</span>
          )}
        </div>
        {/* FOOTER */}
        <div className="chw-footer">
          <button
            className="chw-cancel"
            type="button"
            onClick={() => navigate("/baitap")}
          >
            Hủy
          </button>
          <button className="chw-submit" type="submit">
            Tạo bài tập
          </button>
        </div>
      </form>
    </div>
  );
}