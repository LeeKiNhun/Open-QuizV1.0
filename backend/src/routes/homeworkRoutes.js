// routes/homeworkRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const c = require("../controllers/homeworkController");

const auth = require("../middlewares/auth");

// ===== MULTER UPLOAD =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "homeworks");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// ===== ROUTES =====

// ✅ PUBLIC: Học sinh mở bằng shareCode
router.get("/share/:code", c.getHomeworkByShareCode);

// ✅ PROTECTED: Teacher routes
router.get("/", auth, c.listMyHomeworks);
router.post("/", auth, upload.single("file"), c.createHomework);
router.get("/share/:code", c.getHomeworkByShareCode);

router.get("/:id", auth, c.getHomeworkDetail);
router.patch("/:id", auth, c.updateHomework);
router.delete("/:id", auth, c.deleteHomework);

router.post("/submit", c.submitHomework);
router.post("/:id/publish", auth, c.publishHomework);
module.exports = router;