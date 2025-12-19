const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "editor", "viewer"], default: "viewer" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const structureNodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },          // uuid client hoặc tự sinh
    parentId: { type: String, default: null },     // null = root
    title: { type: String, required: true },       // Chủ đề/Bài/Chương...
    type: { type: String, enum: ["topic", "lesson", "unit", "chapter", "custom"], default: "custom" },
    order: { type: Number, default: 0 },
    meta: { type: Object, default: {} },
  },
  { _id: false }
);

const questionBankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },

    grade: { type: String, default: "" },      // Khối học: "Khối 10"
    subject: { type: String, default: "" },    // Môn học: "Tiếng Anh"
    book: { type: String, default: "" },       // Sách: "Tiếng Anh 10 – Friends Global"

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // UI tab “Cấu trúc”
    structureSource: {
      type: String,
      enum: ["none", "azota_library", "pdf_upload", "docx_upload"],
      default: "none",
    },

    structureNodes: { type: [structureNodeSchema], default: [] },

    // ✅ DOCX preview/apply
    structureDocxText: { type: String, default: "" },
    structureDocxUploadedAt: { type: Date, default: null },

    // quick stats (để hiển thị “(0 Câu hỏi)” nhanh)
    questionCount: { type: Number, default: 0 },

    members: { type: [memberSchema], default: [] }, // tab “Phân quyền”

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionBankSchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
questionBankSchema.index({ "members.user": 1 }); // ✅ thêm index quan trọng cho phân quyền
questionBankSchema.index({ name: "text" });

module.exports = mongoose.model("QuestionBank", questionBankSchema);
