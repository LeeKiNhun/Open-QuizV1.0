// controllers/homeworkController.js
const Homework = require("../models/Homework");
const crypto = require("crypto");

// ===== HELPER FUNCTIONS =====

function makeCode(len = 7) {
  return crypto.randomBytes(16).toString("base64url").slice(0, len);
}

async function genUniqueShareCode() {
  for (let i = 0; i < 5; i++) {
    const code = makeCode(7);
    const existed = await Homework.exists({ shareCode: code });
    if (!existed) return code;
  }
  return makeCode(10);
}

// ===== EXPORTS FUNCTIONS =====

// ✅ GET: Danh sách bài tập của tôi
exports.listMyHomeworks = async (req, res) => {
  try {
    const list = await Homework.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    return res.json({ items: list });
  } catch (e) {
    console.error("listMyHomeworks error:", e);
    return res.status(500).json({ message: "Không thể tải danh sách bài tập." });
  }
};

// ✅ POST: Tạo bài tập mới
exports.createHomework = async (req, res) => {
  try {
    const { title, description, classId, dueFrom, dueTo, allowViewResult } = req.body || {};

    // ✅ Parse classIds từ FormData
    let classIds = [];
    try {
      classIds = JSON.parse(req.body?.classIds || "[]");
    } catch {
      classIds = [];
    }
    classIds = Array.isArray(classIds) ? classIds.map(String) : [];

    // ✅ Fallback tương thích code cũ (nếu FE gửi classId)
    if (classIds.length === 0 && classId) {
      classIds = [String(classId)];
    }

    // ✅ Validate
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Vui lòng nhập tên bài tập." });
    }
    if (classIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 lớp." });
    }

    // ✅ Tạo shareCode/shareUrl
    const shareCode = await genUniqueShareCode();
    const FE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const shareUrl = `${FE_URL.replace(/\/$/, "")}/lam-bai/${shareCode}`;

    // ✅ Tạo document
    const doc = await Homework.create({
      title: String(title).trim(),
      description: description || "",

      classIds: classIds,
      classId: classIds[0] || null, // giữ tương thích field cũ

      dueFrom: dueFrom ? new Date(dueFrom) : null,
      dueTo: dueTo ? new Date(dueTo) : null,
      allowViewResult: !!allowViewResult,

      shareCode,
      shareUrl,

      attachments: [],
      createdBy: req.user._id,
    });

    // ✅ Xử lý file upload nếu có
    if (req.file) {
      const relUrl = `/uploads/homeworks/${req.file.filename}`;
      
      doc.attachments = [
        {
          originalName: req.file.originalname,
          url: relUrl,
          pdfUrl: "",
          mime: req.file.mimetype,
          size: req.file.size,
        },
      ];
      await doc.save();
    }

    return res.status(201).json({ item: doc });
  } catch (e) {
    console.error("createHomework error:", e);
    return res.status(500).json({ message: "Không thể tạo bài tập." });
  }
};

// ✅ GET: Chi tiết bài tập (teacher)
exports.getHomeworkDetail = async (req, res) => {
  try {
    const item = await Homework.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).lean();

    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy bài tập." });
    }
    
    return res.json({ item });
  } catch (e) {
    console.error("getHomeworkDetail error:", e);
    return res.status(500).json({ message: "Không thể tải chi tiết bài tập." });
  }
};

// ✅ GET: Học sinh mở bằng shareCode (PUBLIC)
exports.getHomeworkByShareCode = async (req, res) => {
  try {
    const code = String(req.params.code || "").trim();
    
    if (!code) {
      return res.status(400).json({ message: "Thiếu mã chia sẻ." });
    }

    const item = await Homework.findOne({ shareCode: code }).lean();
    
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy bài tập." });
    }

    return res.json({ item });
  } catch (e) {
    console.error("getHomeworkByShareCode error:", e);
    return res.status(500).json({ message: "Không thể tải bài tập." });
  }
};

// ✅ PATCH: Cập nhật bài tập
exports.updateHomework = async (req, res) => {
  try {
    const patch = {};
    const { title, description, dueFrom, dueTo, allowViewResult } = req.body || {};

    if (title !== undefined) {
      patch.title = String(title).trim();
    }
    if (description !== undefined) {
      patch.description = description || "";
    }
    if (dueFrom !== undefined) {
      patch.dueFrom = dueFrom ? new Date(dueFrom) : null;
    }
    if (dueTo !== undefined) {
      patch.dueTo = dueTo ? new Date(dueTo) : null;
    }
    if (allowViewResult !== undefined) {
      patch.allowViewResult = !!allowViewResult;
    }

    // ✅ Update classIds nếu có
    if (req.body?.classIds !== undefined) {
      let classIds = [];
      try {
        classIds = JSON.parse(req.body?.classIds || "[]");
      } catch {
        classIds = [];
      }
      patch.classIds = Array.isArray(classIds) ? classIds.map(String) : [];
      patch.classId = patch.classIds[0] || null;
    }

    const item = await Homework.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      patch,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy bài tập." });
    }
    
    return res.json({ item });
  } catch (e) {
    console.error("updateHomework error:", e);
    return res.status(500).json({ message: "Không thể cập nhật bài tập." });
  }
};

// ✅ DELETE: Xóa bài tập
exports.deleteHomework = async (req, res) => {
  try {
    const item = await Homework.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy bài tập." });
    }
    
    return res.json({ ok: true, message: "Đã xóa bài tập." });
  } catch (e) {
    console.error("deleteHomework error:", e);
    return res.status(500).json({ message: "Không thể xóa bài tập." });
  }
};
exports.publishHomework = async (req, res) => {
  try {
    const hw = await Homework.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isPublished: true }, // hoặc logic của bạn
      { new: true }
    );
    if (!hw) return res.status(404).json({ message: "Không tìm thấy bài tập" });
    res.json({ ok: true, item: hw });
  } catch (e) {
    res.status(500).json({ message: "Lỗi xuất bản" });
  }
};

// ✅ Đảm bảo có hàm này (dành cho học sinh nộp bài)
exports.submitHomework = async (req, res) => {
  try {
    // Logic nộp bài của bạn ở đây
    res.json({ ok: true, message: "Nộp bài thành công" });
  } catch (e) {
    res.status(500).json({ message: "Lỗi nộp bài" });
  }
};