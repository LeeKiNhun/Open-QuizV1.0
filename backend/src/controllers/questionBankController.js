const QuestionBank = require("../models/QuestionBank");
const Question = require("../models/Question");
const BankActivity = require("../models/BankActivity");

/* ===================== HELPER ===================== */
// FIX TỐI THIỂU: map structureSource về enum hợp lệ theo schema
function mapStructureSource(input) {
  const v = String(input || "").trim();

  // schema chỉ cho: none, azota_library, pdf_upload, docx_upload
  if (!v) return "none";

  // frontend hiện đang gửi
  if (v === "manual_entry") return "none";
  if (v === "docx_preview") return "docx_upload";

  // các giá trị hợp lệ
  if (["none", "azota_library", "pdf_upload", "docx_upload"].includes(v)) {
    return v;
  }

  // fallback an toàn
  return "none";
}

/* ===================== BANK CRUD ===================== */
const BookTemplate = require("../models/BookTemplate");

exports.applyStructureFromLibrary = async (req, res) => {
  const { bankId } = req.params;
  const { bookId } = req.body;

  const book = await BookTemplate.findOne({ bookId, status: "published" });
  if (!book) return res.status(404).json({ ok: false, error: { code: "BOOK_NOT_FOUND", message: "Không tìm thấy bookId" } });

  const nodes = [];
  book.units.forEach((u, ui) => {
    nodes.push({ id: u.id, parentId: null, title: u.title, type: "unit", order: ui, meta: {} });
    u.lessons.forEach((l, li) => {
      nodes.push({ id: l.id, parentId: u.id, title: `Bài ${l.code}: ${l.title}`, type: "lesson", order: li, meta: { code: l.code } });
    });
  });

  const bank = await QuestionBank.findByIdAndUpdate(
    bankId,
    { structureSource: "openquiz_library", structureBookId: bookId, structureNodes: nodes },
    { new: true }
  );

  return res.json({ ok: true, item: bank });
};

exports.listMyBanks = async (req, res, next) => {
  try {
    const banks = await QuestionBank.find({
      isDeleted: false,
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items: banks });
  } catch (e) {
    next(e);
  }
};

exports.createBank = async (req, res, next) => {
  try {
    const { name, grade = "", subject = "", book = "" } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Tên ngân hàng không được để trống." });
    }

    const bank = await QuestionBank.create({
      name,
      grade,
      subject,
      book,
      owner: req.user._id,
      members: [{ user: req.user._id, role: "owner" }],
    });

    res.status(201).json(bank);
  } catch (e) {
    next(e);
  }
};

exports.getBankDetail = async (req, res, next) => {
  try {
    const bank = await QuestionBank.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).lean();

    if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });
    res.json(bank);
  } catch (e) {
    next(e);
  }
};

exports.updateBank = async (req, res, next) => {
  try {
    const bank = await QuestionBank.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true }
    ).lean();

    if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });
    res.json(bank);
  } catch (e) {
    next(e);
  }
};

exports.deleteBank = async (req, res, next) => {
  try {
    const bank = await QuestionBank.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });
    res.json({ message: "Đã xóa ngân hàng." });
  } catch (e) {
    next(e);
  }
};

/* ===================== STRUCTURE (FIX 500 Ở ĐÂY) ===================== */

/**
 * ✅ FIX QUAN TRỌNG:
 * Frontend đang dùng: res.data.items || []
 * Nên API này phải trả { items: [...] } thay vì trả thẳng {structureSource, structureNodes}
 */
exports.getStructure = async (req, res, next) => {
  try {
    const bank = await QuestionBank.findOne(
      { _id: req.params.id, isDeleted: false },
      { structureSource: 1, structureNodes: 1 }
    ).lean();

    if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

    res.json({
      ok: true,
      structureSource: bank.structureSource || "none",
      items: Array.isArray(bank.structureNodes) ? bank.structureNodes : [],
    });
  } catch (e) {
    next(e);
  }
};

exports.saveStructure = async (req, res, next) => {
  try {
    const structureNodes = req.body?.structureNodes;
    if (!Array.isArray(structureNodes)) {
      return res.status(400).json({ message: "structureNodes phải là mảng." });
    }

    const structureSource = mapStructureSource(req.body?.structureSource);

    const bank = await QuestionBank.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { structureSource, structureNodes } },
      {
        new: true,
        runValidators: true, // QUAN TRỌNG: tránh 500 do enum
      }
    ).lean();

    if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

    // ✅ Trả luôn items để frontend dùng thống nhất
    res.json({
      ok: true,
      structureSource: bank.structureSource,
      items: bank.structureNodes || [],
    });
  } catch (e) {
    // trả lỗi rõ ràng, không 500 mù
    if (e?.name === "ValidationError") {
      return res.status(400).json({ message: "Dữ liệu cấu trúc không hợp lệ.", detail: e.message });
    }
    if (e?.name === "CastError") {
      return res.status(400).json({ message: "ID không hợp lệ.", detail: e.message });
    }
    next(e);
  }
};

/* ===================== ANALYTICS ===================== */

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalQuestions = await Question.countDocuments({
      bank: req.params.id,
      isDeleted: false,
    });
    res.json({ totalQuestions, contributions: [] });
  } catch (e) {
    next(e);
  }
};

// helper: tạo id đơn giản
function nid(prefix = "n") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// helper: tạo outline rất đơn giản từ text (MVP)
function buildNodesFromText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Nếu không có gì thì trả rỗng
  if (lines.length === 0) return [];

  // Heuristic:
  // - Dòng bắt đầu bằng: "Unit", "Chương", "Chapter", "Bài", "Lesson" => topic
  // - Dòng còn lại => lesson của topic gần nhất
  const nodes = [];
  let currentTopicId = null;
  let topicOrder = -1;
  let lessonOrder = 0;

  const isTopic = (s) => /^(unit|chương|chapter|bài|lesson)\b/i.test(s);

  lines.forEach((line) => {
    if (isTopic(line) || currentTopicId == null) {
      // tạo topic
      topicOrder += 1;
      lessonOrder = 0;

      currentTopicId = nid("t");
      nodes.push({
        id: currentTopicId,
        parentId: null,
        title: line,
        type: "topic",
        order: topicOrder,
        meta: {},
      });
    } else {
      // tạo lesson
      nodes.push({
        id: nid("l"),
        parentId: currentTopicId,
        title: line,
        type: "lesson",
        order: lessonOrder++,
        meta: {},
      });
    }
  });

  return nodes;
}

// GET /question-banks/:id/structure/preview
exports.previewStructureDocx = async (req, res) => {
  try {
    const bankId = req.params.id;

    const bank = await QuestionBank.findOne({ _id: bankId, isDeleted: false });
    if (!bank) return res.status(404).json({ ok: false, message: "Không tìm thấy ngân hàng." });

    const text = bank.structureDocxText || "";

    return res.json({
      ok: true,
      text: text || "Chưa có nội dung DOCX để xem trước.",
      uploadedAt: bank.structureDocxUploadedAt,
    });
  } catch (e) {
    console.error("previewStructureDocx error:", e);
    return res.status(500).json({ ok: false, message: "Lỗi tải preview DOCX." });
  }
};

// POST /question-banks/:id/structure/apply
exports.applyStructureFromDocx = async (req, res) => {
  try {
    const bankId = req.params.id;

    const bank = await QuestionBank.findOne({ _id: bankId, isDeleted: false });
    if (!bank) return res.status(404).json({ ok: false, message: "Không tìm thấy ngân hàng." });

    // nếu đã có cấu trúc thì giữ nguyên (tránh ghi đè ngoài ý muốn)
    if (Array.isArray(bank.structureNodes) && bank.structureNodes.length > 0) {
      return res.json({
        ok: true,
        message: "Ngân hàng đã có cấu trúc, không cần tạo lại.",
        items: bank.structureNodes, // ✅ thống nhất items
      });
    }

    const text = bank.structureDocxText || "";
    const nodes = buildNodesFromText(text);

    bank.structureSource = "docx_upload";
    bank.structureNodes = nodes;

    await bank.save();

    return res.json({
      ok: true,
      message: "Đã tạo cấu trúc folder từ DOCX.",
      items: nodes, // ✅ thống nhất items
    });
  } catch (e) {
    console.error("applyStructureFromDocx error:", e);
    return res.status(500).json({ ok: false, message: "Lỗi tạo cấu trúc từ DOCX." });
  }
};

/* ===================== STRUCTURE NODE ACTIONS (NEW) ===================== */
/**
 * ✅ Thêm để trang “quản lý folder” có thể SỬA / XOÁ
 * - PATCH /question-banks/:id/structure/nodes/:nodeId
 * - DELETE /question-banks/:id/structure/nodes/:nodeId
 */

exports.renameStructureNode = async (req, res) => {
  try {
    const bankId = req.params.id;
    const nodeId = req.params.nodeId;
    const title = String(req.body?.title || "").trim();

    if (!title) return res.status(400).json({ message: "Thiếu title." });

    const bank = await QuestionBank.findOne({ _id: bankId, isDeleted: false });
    if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

    const nodes = Array.isArray(bank.structureNodes) ? bank.structureNodes : [];
    const node = nodes.find((n) => String(n.id) === String(nodeId));
    if (!node) return res.status(404).json({ message: "Không tìm thấy folder." });

    node.title = title;
    await bank.save();

    return res.json({ ok: true, items: bank.structureNodes || [] });
  } catch (e) {
    console.error("renameStructureNode error:", e);
    return res.status(500).json({ message: "Lỗi đổi tên folder." });
  }
};

function collectDescendants(nodes, rootId) {
  const childrenMap = new Map();
  for (const n of nodes) {
    const pid = n.parentId ?? null;
    if (!childrenMap.has(pid)) childrenMap.set(pid, []);
    childrenMap.get(pid).push(n.id);
  }

  const del = new Set([rootId]);
  const stack = [rootId];

  while (stack.length) {
    const cur = stack.pop();
    const kids = childrenMap.get(cur) || [];
    for (const k of kids) {
      if (!del.has(k)) {
        del.add(k);
        stack.push(k);
      }
    }
  }
  return del;
}

exports.deleteStructureNode = async (req, res) => {
  try {
    const bankId = req.params.id;
    const nodeId = req.params.nodeId;

    const bank = await QuestionBank.findOne({ _id: bankId, isDeleted: false });
    if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

    const nodes = Array.isArray(bank.structureNodes) ? bank.structureNodes : [];
    const exists = nodes.some((n) => String(n.id) === String(nodeId));
    if (!exists) return res.status(404).json({ message: "Không tìm thấy folder." });

    const delSet = collectDescendants(nodes, nodeId);
    bank.structureNodes = nodes.filter((n) => !delSet.has(n.id));

    await bank.save();

    return res.json({ ok: true, items: bank.structureNodes || [] });
  } catch (e) {
    console.error("deleteStructureNode error:", e);
    return res.status(500).json({ message: "Lỗi xóa folder." });
  }
};
