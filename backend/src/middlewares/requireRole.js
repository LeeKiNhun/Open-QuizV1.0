const QuestionBank = require("../models/QuestionBank");

function requireBankRole(allowed = ["owner", "editor", "viewer"]) {
  return async (req, res, next) => {
    try {
      const bankId = req.params.bankId || req.params.id || req.body.bankId;
      if (!bankId) return res.status(400).json({ message: "Thiếu bankId." });

      const bank = await QuestionBank.findOne({ _id: bankId, isDeleted: false }).lean();
      if (!bank) return res.status(404).json({ message: "Không tìm thấy ngân hàng." });

      const uid = String(req.user._id);

      let role = null;
      if (String(bank.owner) === uid) role = "owner";
      else {
        const m = (bank.members || []).find(x => String(x.user) === uid);
        role = m?.role || null;
      }

      if (!role) return res.status(403).json({ message: "Bạn không có quyền truy cập ngân hàng này." });
      if (!allowed.includes(role)) return res.status(403).json({ message: "Không đủ quyền thực hiện thao tác." });

      req.bank = bank;
      req.bankRole = role;
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireBankRole };