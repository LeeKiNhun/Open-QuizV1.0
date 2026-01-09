const Question = require("../models/Question");
const QuestionBank = require("../models/QuestionBank");
const BankActivity = require("../models/BankActivity");
const mammoth = require("mammoth");
const Quiz = require("../models/Quiz");
const mongoose = require("mongoose");

function makeCode() {
  // demo code sinh đơn giản, bạn có thể đổi theo chuẩn bạn muốn
  return "QB-" + Date.now();
}
exports.generateQuiz = async (req, res, next) => {
  try {
    const ownerId = req.user?._id;
    const { title, bankId, bookId, lessonIds = [], numQuestions = 20, shuffle = true } = req.body;

    if (!mongoose.isValidObjectId(bankId)) {
      return res.status(400).json({ ok: false, error: { code: "BAD_BANK", message: "bankId không hợp lệ" } });
    }
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({ ok: false, error: { code: "NO_LESSON", message: "Chọn ít nhất 1 lesson" } });
    }

    // 1) Load bank + validate lessonIds có tồn tại trong structureNodes không
    const bank = await QuestionBank.findById(bankId).select("structureNodes").lean();
    if (!bank) {
      return res.status(404).json({ ok: false, error: { code: "BANK_NOT_FOUND", message: "Không tìm thấy ngân hàng" } });
    }

    const lessonSet = new Set(
      (bank.structureNodes || [])
        .filter((n) => n && n.type === "lesson" && n.id)
        .map((n) => n.id)
    );

    if (lessonSet.size === 0) {
      return res.status(400).json({
        ok: false,
        error: { code: "BANK_NO_STRUCTURE", message: "Ngân hàng chưa có cấu trúc lesson. Hãy áp cấu trúc trước." },
      });
    }

    const invalidLessonIds = lessonIds.filter((id) => !lessonSet.has(id));
    if (invalidLessonIds.length) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "LESSON_NOT_IN_STRUCTURE",
          message: "Một số lessonIds không tồn tại trong cấu trúc của ngân hàng",
          invalidLessonIds,
        },
      });
    }

    // 2) Lấy pool câu hỏi theo lessonIds
    // ✅ type đúng với schema của bạn là "mcq"
    const pool = await Question.find({
      bank: bankId,
      isDeleted: false,
      type: "mcq",
      structureNodeId: { $in: lessonIds },
    }).select("_id");

    if (pool.length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "NO_QUESTIONS",
          message: "Không có câu hỏi nào thuộc các lesson đã chọn. (Kiểm tra structureNodeId khi import seed)",
        },
      });
    }

    // 3) Random pick
    const k = Math.min(Math.max(1, Number(numQuestions) || 20), pool.length);

    // Fisher-Yates shuffle ids
    const ids = pool.map((x) => x._id.toString());
    if (shuffle) {
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
    }
    const picked = ids.slice(0, k).map((id) => new mongoose.Types.ObjectId(id));

    // 4) Create quiz
    const quiz = await Quiz.create({
      ownerId,
      title: title || `Quiz (${lessonIds.length} lessons)`,
      bankId,
      bookId,
      lessonIds,
      questionIds: picked,
      config: { numQuestions: k, shuffle },
    });

    return res.json({ ok: true, item: quiz });
  } catch (e) {
    next(e);
  }
};


exports.listQuestions = async (req, res, next) => {
  try {
    const bankId = req.params.bankId;
    const code = String(req.query.code || "").trim();

    const filter = { bank: bankId, isDeleted: false };
    if (code) filter.code = code;

    const items = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({ items });
  } catch (e) {
    next(e);
  }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const bankId = req.params.bankId;
    const {
      type = "mcq",
      content,
      choices = [],
      answer = {},
      explanation = "",
      structureNodeId = null,
    } = req.body;

    if (!content || !String(content).trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung câu hỏi không được để trống." });
    }

    const q = await Question.create({
      bank: bankId,
      code: makeCode(),
      type,
      content,
      choices,
      answer,
      explanation,
      structureNodeId,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await QuestionBank.updateOne(
      { _id: bankId },
      { $inc: { questionCount: 1 } }
    );

    await BankActivity.create({
      bank: bankId,
      actor: req.user._id,
      action: "question_created",
      payload: { code: q.code, type: q.type },
    });

    res.status(201).json(q);
  } catch (e) {
    next(e);
  }
};

/**
 * IMPORT JSON QUESTIONS
 * ❗ KHÔNG LIÊN QUAN DOCX – GIỮ NGUYÊN LOGIC
 */
exports.importQuestions = async (req, res, next) => {
  try {
    const bankId = req.params.bankId;

    // FE gửi lên dạng JSON questions[]
    const { questions = [] } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách câu hỏi import rỗng." });
    }

    const docs = questions.map((item) => ({
      bank: bankId,
      code: item.code || makeCode(),
      type: item.type || "mcq",
      content: item.content,
      choices: item.choices || [],
      answer: item.answer || {},
      explanation: item.explanation || "",
      structureNodeId: item.structureNodeId || null,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    }));

    const inserted = await Question.insertMany(docs, { ordered: false });

    await QuestionBank.updateOne(
      { _id: bankId },
      { $inc: { questionCount: inserted.length } }
    );

    await BankActivity.create({
      bank: bankId,
      actor: req.user._id,
      action: "question_imported",
      payload: { imported: inserted.length },
    });

    res.json({ imported: inserted.length });
  } catch (e) {
    next(e);
  }
};

/**
 * ==============================
 * UPLOAD DOCX → PREVIEW STRUCTURE
 * ==============================
 * DÙNG CHO TRANG PREVIEW DOCX
 */
exports.uploadStructureDocx = async (req, res, next) => {
  try {
    const bankId = req.params.bankId;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Không có file DOCX được upload." });
    }

    // 1️⃣ tìm ngân hàng
    const bank = await QuestionBank.findById(bankId);
    if (!bank) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy ngân hàng câu hỏi." });
    }

    // 2️⃣ parse DOCX → text
    const result = await mammoth.extractRawText({
      path: req.file.path,
    });

    const text = result.value || "";

    // 3️⃣ LƯU TEXT ĐỂ PREVIEW
    bank.structureDocxText = text;
    bank.structureDocxUploadedAt = new Date();
    await bank.save();

    res.json({
      ok: true,
      message: "Upload DOCX thành công. Có thể xem preview.",
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};
