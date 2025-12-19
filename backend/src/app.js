const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const quizRoutes = require("./routes/quizRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const questionBankRoutes = require("./routes/questionBankRoutes");
const homeworkRoutes = require("./routes/homeworkRoutes");
const allowedOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/$/, "");


const passport = require("passport");
const initPassport = require("./config/passport");
const path = require("path");
const fs = require("fs"); // ✅ thêm
const app = express();


// ✅ đảm bảo thư mục uploads tồn tại (fix lỗi upload không ghi được file)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/api", require("./routes/debugUpload"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, cb) => {
      // cho phép tools như Postman (origin undefined) và đúng origin của browser
      if (!origin) return cb(null, true);
      return cb(null, origin.replace(/\/$/, "") === allowedOrigin);
    },
    credentials: true,
  })
);

app.use("/uploads", express.static("uploads"));
app.use("/api/homeworks", homeworkRoutes);

// ✅ CORS nên đặt sớm (trước các route)

// ✅ static uploads
app.use("/uploads", express.static(uploadDir));

// ✅ route upload PDF cấu trúc (giữ nguyên đúng như bạn đang mount)
app.use("/api", require("./routes/questionBankStructure"));

initPassport();
app.use(passport.initialize());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attempts", attemptRoutes);

// ✅ CHỈ mount 1 lần (bạn đang mount trùng 2 lần)
app.use("/api/question-banks", questionBankRoutes);

app.use("/api", require("./routes/questionRoutes"));

module.exports = app;