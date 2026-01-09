// backend/src/routes/questionBankStructure.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mammoth = require("mammoth");

const mongoose = require("mongoose");
const QuestionBank = require("../models/QuestionBank");
const BookTemplate = require("../models/BookTemplate");
const Question = require("../models/Question");

const router = express.Router();

/* =======================
   Helpers
======================= */
function mapStructureSource(input) {
  const v = String(input || "").trim();

  // schema cho: none, azota_library, pdf_upload, docx_upload
  if (!v) return "none";

  // FE cũ / biến thể
  if (v === "manual_entry") return "none";
  if (v === "docx_preview") return "docx_upload";
  if (v === "openquiz_library") return "azota_library"; // map alias cũ

  if (["none", "azota_library", "pdf_upload", "docx_upload"].includes(v)) return v;

  return "none";
}

function makeCode(prefix = "Q") {
  // đảm bảo unique tương đối (kèm random)
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * Seed ~50 câu hỏi cho bank theo lessonIds.
 * - Nếu lesson có sẵn câu hỏi rồi thì chỉ bù cho đủ.
 * - Tổng seed mặc định: total = 50
 */
async function seedQuestionsForBank({ bankId, lessonIds, total = 50, createdBy = null }) {
  if (!lessonIds?.length) return { inserted: 0 };

  // chia đều
  const perLesson = Math.max(1, Math.floor(total / lessonIds.length));
  let needExtra = total - perLesson * lessonIds.length;

  let insertedTotal = 0;

  for (const lessonId of lessonIds) {
    const target = perLesson + (needExtra > 0 ? 1 : 0);
    if (needExtra > 0) needExtra -= 1;

    // đếm hiện có
    const existing = await Question.countDocuments({
      bank: bankId,
      isDeleted: false,
      structureNodeId: lessonId,
      type: "mcq",
    });

    const missing = Math.max(0, target - existing);
    if (missing === 0) continue;

    const docs = Array.from({ length: missing }).map((_, i) => ({
      bank: bankId,
      code: makeCode(`SEED-${lessonId}`),
      type: "mcq",
      content: `[Seed - ${lessonId}] Câu ${existing + i + 1}`,
      choices: ["A", "B", "C", "D"],
      answer: { correct: 0 },
      explanation: "Auto-seeded question",
      structureNodeId: lessonId,
      difficulty: "easy",
      tags: ["seed"],
      createdBy,
      updatedBy: createdBy,
      isDeleted: false,
    }));

    const inserted = await Question.insertMany(docs, { ordered: false });
    insertedTotal += inserted.length;
  }

  return { inserted: insertedTotal };
}

/* =======================
   Upload config (DOCX)
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
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
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

    if (!mongoose.isValidObjectId(bankId)) {
      return res.status(400).json({ ok: false, message: "bankId không hợp lệ" });
    }

    const bank = await QuestionBank.findById(bankId).lean();
    if (!bank || bank.isDeleted) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy ngân hàng." });
    }

    return res.json({
      ok: true,
      bankId,
      structureSource: bank.structureSource || "none",
      structureNodes: bank.structureNodes || [],
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
});

/* =======================
   PUT SAVE STRUCTURE (MANUAL)
======================= */
// PUT /api/question-banks/:bankId/structure
router.put("/question-banks/:bankId/structure", async (req, res) => {
  try {
    const { bankId } = req.params;
    const { structureNodes, structureSource } = req.body;

    if (!mongoose.isValidObjectId(bankId)) {
      return res.status(400).json({ ok: false, message: "bankId không hợp lệ" });
    }
    if (!Array.isArray(structureNodes)) {
      return res.status(400).json({ ok: false, message: "structureNodes phải là mảng." });
    }

    const bank = await QuestionBank.findById(bankId);
    if (!bank || bank.isDeleted) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy ngân hàng." });
    }

    bank.structureNodes = structureNodes;
    bank.structureSource = mapStructureSource(structureSource);

    await bank.save();

    return res.json({
      ok: true,
      message: "Saved",
      bankId,
      structureSource: bank.structureSource,
      structureNodes: bank.structureNodes,
    });
  } catch (e) {
    // enum / validate => 400 cho dễ debug
    if (e?.name === "ValidationError") {
      return res.status(400).json({ ok: false, message: "Dữ liệu cấu trúc không hợp lệ", detail: e.message });
    }
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
});

/* =======================
   APPLY STRUCTURE FROM LIBRARY + AUTO SEED QUESTIONS ✅
======================= */
/**
 * PUT /api/question-banks/:bankId/structure/from-library
 * body: { bookId, seedTotal?: number }
 *
 * - lấy BookTemplate theo bookId
 * - convert units/lessons -> structureNodes (topic/unit + lesson)
 * - save vào QuestionBank
 * - auto seed ~50 câu hỏi (mặc định) vào các lesson để tạo đề được ngay
 */
router.put("/question-banks/:bankId/structure/from-library", async (req, res) => {
  try {
    const { bankId } = req.params;
    const { bookId, seedTotal = 50 } = req.body;

    if (!mongoose.isValidObjectId(bankId)) {
      return res.status(400).json({ ok: false, message: "bankId không hợp lệ" });
    }
    if (!bookId) {
      return res.status(400).json({ ok: false, message: "Thiếu bookId" });
    }

    const bank = await QuestionBank.findById(bankId);
    if (!bank || bank.isDeleted) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy ngân hàng." });
    }

    const book = await BookTemplate.findOne({ bookId, status: "published" }).lean();
    if (!book) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy sách (BookTemplate) theo bookId." });
    }

    const nodes = [];
    const lessonIds = [];

    (book.units || []).forEach((u, ui) => {
      // unit -> type "topic" (UI của bạn đang coi parentId null là topic)
      nodes.push({
        id: u.id,
        parentId: null,
        title: u.title,
        type: "topic",
        order: ui,
        meta: { source: "library", bookId },
      });

      (u.lessons || []).forEach((l, li) => {
        nodes.push({
          id: l.id,
          parentId: u.id,
          title: `Bài ${l.code}: ${l.title}`,
          type: "lesson",
          order: li,
          meta: { code: l.code },
        });
        lessonIds.push(l.id);
      });
    });

    bank.structureSource = "azota_library";
    bank.structureNodes = nodes;
    await bank.save();

    // ✅ AUTO SEED QUESTIONS (~50)
    const createdBy = req.user?._id || null; // nếu route này có auth thì sẽ có req.user
    const seeded = await seedQuestionsForBank({
      bankId: bank._id,
      lessonIds,
      total: Math.max(1, Number(seedTotal) || 50),
      createdBy,
    });

    // update quick count
    if (seeded.inserted > 0) {
      await QuestionBank.updateOne({ _id: bank._id }, { $inc: { questionCount: seeded.inserted } });
    }

    return res.json({
      ok: true,
      message: "Applied structure from library + seeded questions",
      bankId,
      bookId,
      structureSource: bank.structureSource,
      structureNodes: bank.structureNodes,
      seeded: seeded.inserted,
    });
  } catch (e) {
    console.error("from-library error:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
});

/* =======================
   UPLOAD DOCX (giữ)
======================= */
// POST /api/question-banks/:bankId/structure/docx
router.post("/question-banks/:bankId/structure/docx", upload.single("docx"), async (req, res) => {
  try {
    const { bankId } = req.params;

    if (!mongoose.isValidObjectId(bankId)) {
      return res.status(400).json({ ok: false, message: "bankId không hợp lệ" });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "Không nhận được file DOCX." });
    }

    const bank = await QuestionBank.findById(bankId);
    if (!bank || bank.isDeleted) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy ngân hàng." });
    }

    const buffer = fs.readFileSync(path.join(uploadDir, req.file.filename));
    const { value } = await mammoth.extractRawText({ buffer });
    const cleanText = String(value || "").trim();

    bank.structureSource = "docx_upload";
    bank.structureDocxText = cleanText;
    bank.structureDocxUploadedAt = new Date();
    // bạn muốn parse ra nodes thì parse ở controller khác, còn đây giữ preview text
    await bank.save();

    return res.json({
      ok: true,
      message: "Upload DOCX OK",
      bankId,
      structureSource: bank.structureSource,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
});

module.exports = router;
