// src/pages/HomeworkPages/HomeworkPublishSuccessPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HomeworkPublishSuccessPage.css";

import { publishHomework } from "../api/homeworkApi";

export default function HomeworkPublishSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const homeworkIdFromQuery = useMemo(() => {
    return new URLSearchParams(location.search).get("id");
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // data hiển thị
  const [title, setTitle] = useState(state?.title || "Bài tập");
  const [classLabel, setClassLabel] = useState(
    state?.className ||
      (Array.isArray(state?.classNames) ? state.classNames.join(", ") : "") ||
      "—"
  );
  
  // ✅ THÊM: state cho shareCode
  const [shareCode, setShareCode] = useState(state?.shareCode || "");
  
  // ✅ SỬA: Tạo shareUrl từ shareCode thay vì lấy từ backend
  const shareUrl = shareCode 
    ? `${window.location.origin}/lam-bai/${shareCode}` 
    : "";
  
  const [homeworkId, setHomeworkId] = useState(state?.homeworkId || homeworkIdFromQuery || "");
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = homeworkIdFromQuery || state?.homeworkId;

    // ✅ SỬA: Nếu đã có shareCode từ state thì khỏi gọi backend
    if (state?.shareCode) return;

    if (!id) {
      setErr("Thiếu homeworkId. Hãy điều hướng dạng: /baitap/xuatban?id=...");
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await publishHomework(id);

        const hw = res?.homework || res?.item || res?.data?.homework || res?.data?.item || null;
        
        // ✅ SỬA: Lấy shareCode từ response
        const code = hw?.shareCode || res?.shareCode || "";

        if (!alive) return;

        setHomeworkId(hw?._id || id);
        setTitle(hw?.title || state?.title || "Bài tập");
        
        // ✅ SỬA: Set shareCode thay vì shareUrl
        setShareCode(code);

        const cls =
          (Array.isArray(hw?.classNames) && hw.classNames.join(", ")) ||
          (Array.isArray(state?.classNames) && state.classNames.join(", ")) ||
          state?.className ||
          (Array.isArray(hw?.classIds) ? `(${hw.classIds.length} lớp)` : "—");

        setClassLabel(cls);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Không thể xuất bản bài tập.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [homeworkIdFromQuery, state]);

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("Copy link:", shareUrl);
    }
  };

  return (
    <div
        className="pbs-overlay"
        onClick={() => navigate(-1)}
    >
        <div
        className="pbs-page"
        onClick={(e) => e.stopPropagation()}
        >
        <button className="pbs-close" type="button" onClick={() => navigate(-1)}>
            ✕
        </button>

        <div className="pbs-wrap">
            <div className="pbs-title">Xuất bản thành công 🎉</div>
            <div className="pbs-sub">
            Copy link bên dưới và gửi cho học sinh. Học sinh truy cập link để làm bài và nộp bài.
            </div>

            <div className="pbs-card">
            {loading && <div style={{ marginBottom: 10 }}>Đang tạo link...</div>}
            {!!err && <div style={{ marginBottom: 10, color: "crimson" }}>{err}</div>}

            <div className="pbs-card-title">{title}</div>
            <div className="pbs-card-sub">{classLabel}</div>

            <div className="pbs-link-row">
                <input className="pbs-link" value={shareUrl || ""} readOnly />
                <button className="pbs-copy" type="button" onClick={onCopy} disabled={!shareUrl}>
                {copied ? "Đã copy" : "Sao chép"}
                </button>
            </div>

            <div className="pbs-actions">
                <button
                type="button"
                className="pbs-action primary"
                onClick={() => {
                    if (homeworkId) navigate(`/baitap/${homeworkId}/nopbai`);
                    else navigate("/baitap");
                }}
                >
                📋 Quản lý danh sách nộp bài tập
                </button>

                <button
                type="button"
                className="pbs-action secondary"
                onClick={() => navigate("/baitap")}
                >
                📁 Về trang bài tập trong lớp
                </button>
            </div>
            </div>
        </div>
        </div>
    </div>
    );
}