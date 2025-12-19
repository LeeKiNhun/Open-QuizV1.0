// backend/src/controllers/authControllers.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { role: user.vaiTro },
    process.env.JWT_SECRET,
    { subject: String(user._id), expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function toSafeUser(user) {
  return {
    id: user._id,
    hoTen: user.hoTen,
    email: user.email,
    vaiTro: user.vaiTro,
    avatarUrl: user.avatarUrl || "",
  };
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { hoTen, email, password, vaiTro } = req.body || {};
    if (!hoTen || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ họ tên, email, mật khẩu." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự." });
    }

    const existed = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existed) return res.status(409).json({ message: "Email đã tồn tại." });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      hoTen,
      email: String(email).toLowerCase().trim(),
      passwordHash,
      vaiTro: vaiTro || "teacher",
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    if (user.trangThai !== "active") return res.status(403).json({ message: "Tài khoản đang bị khóa." });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });

    const token = signToken(user);
    return res.json({ token, user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (req.user được set bởi middleware auth)
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });
    return res.json({ user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};