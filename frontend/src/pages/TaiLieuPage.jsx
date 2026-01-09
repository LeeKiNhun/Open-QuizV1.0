import React from "react";

export default function TaiLieuPage() {
  const go = (file) => {
    window.location.href = `/openquiz/${file}`;
  };

  const hoverIn = (e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow =
      "0 10px 22px rgba(37, 99, 235, 0.45)";
  };

  const hoverOut = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 6px 16px rgba(37, 99, 235, 0.35)";
  };

  const hoverInLight = (e) => {
    e.currentTarget.style.transform = "translateY(-3px)";
    e.currentTarget.style.boxShadow =
      "0 8px 18px rgba(15, 23, 42, 0.18)";
  };

  const hoverOutLight = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 4px 10px rgba(15, 23, 42, 0.12)";
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>
        📘 TÀI LIỆU & NGÂN HÀNG ĐỀ – OPENQUIZ
      </h2>

      {/* ===== MẸO & HƯỚNG DẪN ===== */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>🎯 MẸO LÀM BÀI TRẮC NGHIỆM</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Khoanh chắc câu dễ trước, không sa đà câu khó</li>
          <li style={styles.li}>Mỗi câu không quá 1 phút</li>
          <li style={styles.li}>Không bỏ trống đáp án</li>
          <li style={styles.li}>Loại trừ đáp án sai rõ ràng</li>
        </ul>

        <h3 style={styles.sectionTitle}>📊 MẸO RIÊNG MÔN ĐỊA LÍ</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Luôn tận dụng Atlat nếu được phép</li>
          <li style={styles.li}>Câu hỏi biểu đồ → xác định dạng trước</li>
          <li style={styles.li}>Nhớ theo vùng kinh tế – không học rời rạc</li>
        </ul>

        <h3 style={styles.sectionTitle}>📐 MẸO RIÊNG MÔN TOÁN</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Nhận diện nhanh dạng bài</li>
          <li style={styles.li}>Không tính dài dòng</li>
          <li style={styles.li}>Dùng máy tính cho câu vận dụng</li>
        </ul>

        <h3 style={styles.sectionTitle}>🧠 GHI NHỚ LÂU</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>Học theo sơ đồ tư duy</li>
          <li style={styles.li}>Làm đề xen kẽ ôn lý thuyết</li>
          <li style={styles.li}>Sai câu nào ghi chú lại</li>
        </ul>
      </section>

      {/* ===== TÀI LIỆU ===== */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>📚 TÀI LIỆU HỌC TẬP</h3>
        <div style={styles.btnGroup}>
          {[
            { label: "📘 Ôn tập nhiều môn", file: "ontap.html" },
            { label: "📊 Biểu đồ Địa lí", file: "bieudo.html" },
            { label: "💡 Mẹo học nhanh", file: "meohoc.html" },
          ].map((b, i) => (
            <button
              key={i}
              style={styles.docBtn}
              onClick={() => go(b.file)}
              onMouseEnter={hoverInLight}
              onMouseLeave={hoverOutLight}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      {/* ===== NGÂN HÀNG ĐỀ ===== */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>
          📝 NGÂN HÀNG ĐỀ THI (50 CÂU – 45 PHÚT)
        </h3>
        <p style={styles.desc}>Chọn 1 đề để bắt đầu làm bài:</p>

        <div style={styles.examGrid}>
          {Array.from({ length: 100 }).map((_, i) => (
            <button
              key={i}
              style={styles.examBtn}
              onClick={() => go("quiz-bank.html")}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              📝 Đề số {i + 1}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ===== STYLE ===== */
const styles = {
  wrapper: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 22px 60px",
  },

  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: 800,
    color: "#1e3a8a",
    marginBottom: 32,
  },

  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "24px 26px",
    marginBottom: 32,
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#2563eb",
    marginBottom: 12,
    marginTop: 20,
  },

  ul: {
    paddingLeft: 20,
    marginBottom: 12,
  },

  li: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.7,
    marginBottom: 6,
  },

  btnGroup: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
  },

  docBtn: {
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontWeight: 600,
    padding: "12px 20px",
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.12)",
  },

  desc: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },

  examGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 14,
  },

  examBtn: {
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    color: "#ffffff",
    border: "none",
    borderRadius: 14,
    padding: "14px 0",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 6px 16px rgba(37, 99, 235, 0.35)",
  },
};
