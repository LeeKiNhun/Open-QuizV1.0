const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionBank", required: true, index: true },
    title: { type: String, required: true },

    // lưu cấu hình generate
    lessonIds: { type: [String], default: [] },
    numQuestions: { type: Number, default: 20 },
    shuffle: { type: Boolean, default: true },

    // danh sách câu hỏi đã chọn
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
