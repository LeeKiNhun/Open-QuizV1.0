const Question = require("../models/Question");
const QuestionBank = require("../models/QuestionBank");
const BankActivity = require("../models/BankActivity");
const mammoth = require("mammoth");

function makeCode() {
  // demo code sinh đơn giản, bạn có thể đổi theo chuẩn bạn muốn
  return "QB-" + Date.now();
}

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
