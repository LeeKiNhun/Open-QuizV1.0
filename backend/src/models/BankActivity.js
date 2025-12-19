const mongoose = require("mongoose");

const bankActivitySchema = new mongoose.Schema(
  {
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionBank", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "bank_created",
        "bank_updated",
        "structure_created",
        "structure_updated",
        "question_imported",
        "question_created",
        "question_updated",
        "member_added",
        "member_removed",
        "role_changed",
        "bank_deleted",

      ],
      required: true,
    },
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankActivity", bankActivitySchema);
