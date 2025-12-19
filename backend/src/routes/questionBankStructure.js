const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mammoth = require("mammoth");

const QuestionBank = require("../models/QuestionBank");

const router = express.Router();

/* =======================
   FIX TỐI THIỂU ENUM
======================= */
function mapStructureSource(input) {
  const v = String(input || "").trim();

  // schema chỉ cho: none, azota_library, pdf_upload, docx_upload
  if (!v) return "none";

  // frontend đang gửi
  if (v === "manual_entry") return "none";
  if (v === "docx_preview") return "docx_upload";

  // giá trị hợp lệ
  if (["none", "azota_library", "pdf_upload", "docx_upload"].includes(v)) {
    return v;
  }

  return "none";
}

/* =======================
   UPLOAD CONFIG (DOCX)
======================= */
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.toLowerCase().endsWith(".docx");
    if (!ok) return cb(new Error("Chỉ hỗ trợ DOCX."), false);
    cb(null, true);
  },
});

/* =======================
   GET STRUCTURE
======================= */
// GET /api/question-banks/:bankId/structure
router.get("/question-banks/:bankId/structure", async (req, res) => {
  try {
    const { bankId } = req.params;

    const bank = await QuestionBank.findById(bankId).lean();
    if (!bank || bank.isDeleted)
      return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

    return res.json({
      bankId,
      structureSource: bank.structureSource || "none",
      structureNodes: bank.structureNodes || [],
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || "Server error" });
  }
});

/* =======================
   PUT SAVE STRUCTURE  ✅ FIX 500 Ở ĐÂY
======================= */
// PUT /api/question-banks/:bankId/structure
router.put("/question-banks/:bankId/structure", async (req, res) => {
  try {
    const { bankId } = req.params;
    const { structureNodes, structureSource } = req.body;

    if (!Array.isArray(structureNodes))
      return res.status(400).json({ message: "structureNodes phải là mảng." });

    const bank = await QuestionBank.findById(bankId);
    if (!bank || bank.isDeleted)
      return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

    // ✅ FIX ENUM
    const fixedSource = mapStructureSource(structureSource);

    bank.structureNodes = structureNodes;
    bank.structureSource = fixedSource;

    await bank.save();

    return res.json({
      message: "Saved",
      bankId,
      structureSource: bank.structureSource,
      structureNodes: bank.structureNodes,
    });
  } catch (e) {
    console.error("SAVE STRUCTURE ERROR:", e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
});

/* =======================
   UPLOAD DOCX (GIỮ NGUYÊN)
======================= */
// POST /api/question-banks/:bankId/structure/docx
router.post(
  "/question-banks/:bankId/structure/docx",
  upload.single("docx"),
  async (req, res) => {
    try {
      const { bankId } = req.params;
      const { grade, subject } = req.body;

      if (!req.file)
        return res
          .status(400)
          .json({ message: "Không nhận được file DOCX." });

      const bank = await QuestionBank.findById(bankId);
      if (!bank || bank.isDeleted)
        return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

      const buffer = fs.readFileSync(
        path.join(uploadDir, req.file.filename)
      );

      const { value } = await mammoth.extractRawText({ buffer });
      const cleanText = String(value || "").trim();

      bank.structureSource = "docx_upload";
      bank.structureNodes = [];

      await bank.save();

      return res.json({
        message: "Upload + Save OK",
        bankId,
        structureSource: bank.structureSource,
      });
    } catch (e) {
      return res.status(500).json({ message: e?.message || "Server error" });
    }
  }
);

module.exports = router;
