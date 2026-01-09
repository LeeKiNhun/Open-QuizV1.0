const express = require("express");
const cors = require("cors");
const passport = require("passport");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const quizRoutes = require("./routes/quizRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const questionBankRoutes = require("./routes/questionBankRoutes");
const homeworkRoutes = require("./routes/homeworkRoutes");
const initPassport = require("./config/passport");

const app = express();

/** =========================
 *  Uploads dir
 * ========================= */
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/** =========================
 *  Body parsers (đặt sớm)
 * ========================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/** =========================
 *  CORS (đặt TRƯỚC routes)
 *  - KHÔNG dùng app.options("*") vì Express/router mới sẽ crash
 *  - Preflight xử lý bằng middleware OPTIONS riêng
 * ========================= */
const allowedOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
const allowedOrigins = new Set([
  allowedOrigin,
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
]);

const corsMiddleware = cors({
  origin: (origin, cb) => {
    // Postman/curl không có Origin => allow
    if (!origin) return cb(null, true);

    const normalized = origin.replace(/\/$/, "");
    if (allowedOrigins.has(normalized)) return cb(null, true);

    return cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.use(corsMiddleware);

// ✅ Preflight: trả 204 + header CORS (corsMiddleware sẽ set header)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/** =========================
 *  Static uploads
 * ========================= */
app.use("/uploads", express.static(uploadDir));
app.use("/api/library", require("./routes/libraryRoutes"));

/** =========================
 *  Passport
 * ========================= */
initPassport();
app.use(passport.initialize());

/** =========================
 *  Health
 * ========================= */
app.get("/api/health", (req, res) => res.json({ ok: true }));

/** =========================
 *  Routes
 * ========================= */
app.use("/api", require("./routes/debugUpload")); // nếu cần
app.use("/api/homeworks", homeworkRoutes);

// legacy structure docx routes
app.use("/api", require("./routes/questionBankStructure"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/question-banks", questionBankRoutes);
app.use("/api", require("./routes/questionRoutes"));

/** =========================
 *  Error handler (để thấy lỗi CORS rõ)
 * ========================= */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, message: err.message || "Server error" });
});

module.exports = app;
