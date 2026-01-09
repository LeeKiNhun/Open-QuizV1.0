// backend/src/models/Attempt.js
const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress", index: true },

    // answers: chọn 1 đáp án
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
        selectedIndex: { type: Number, required: true }, // 0..3
        isCorrect: { type: Boolean, default: false },
      },
    ],

    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

attemptSchema.index({ quiz: 1, user: 1, status: 1 });

module.exports = mongoose.model("Attempt", attemptSchema);
