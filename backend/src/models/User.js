const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    hoTen: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // 🔹 SỬA TỐI THIỂU: không bắt buộc để dùng OAuth
    passwordHash: { type: String, default: "" },

    // 🔹 THÊM TỐI THIỂU cho Google / Microsoft
    maGoogle: { type: String, default: "" },
    maMicrosoft: { type: String, default: "" },

    vaiTro: { type: String, enum: ["teacher", "student", "admin"], default: "teacher" },
    avatarUrl: { type: String, default: "" },

    trangThai: { type: String, enum: ["active", "blocked"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);