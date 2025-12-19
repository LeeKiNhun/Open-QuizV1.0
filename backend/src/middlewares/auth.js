const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) return res.status(401).json({ message: "Bạn chưa đăng nhập." });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ CHỈ THÊM: hỗ trợ cả req.user._id và req.user.id (để controller dùng _id không bị undefined)
    const userId = payload.sub;

    req.user = {
      _id: userId,      // ✅ thêm
      id: userId,       // giữ nguyên (để nơi khác dùng id vẫn chạy)
      vaiTro: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
  }
};