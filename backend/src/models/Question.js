const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionBank", required: true, index: true },

    // UI search “Nhập mã câu hỏi”
    code: { type: String, required: true }, // ví dụ: QB-2025-00001
    type: { type: String, enum: ["mcq", "true_false", "short_answer", "essay"], default: "mcq" },

    content: { type: String, required: true },   // stem
    choices: { type: [String], default: [] },    // cho mcq/true_false
    answer: { type: Object, default: {} },       // đáp án chuẩn (tùy type)
    explanation: { type: String, default: "" },

    // gắn vào cấu trúc
    structureNodeId: { type: String, default: null },

    difficulty: { type: String, enum: ["easy", "medium", "hard", ""], default: "" },
    tags: { type: [String], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ bank: 1, isDeleted: 1, createdAt: -1 });
questionSchema.index({ bank: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Question", questionSchema);