// backend/routes/questionBank.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const { requireBankRole } = require("../middlewares/requireRole");
const c = require("../controllers/questionBankController");

// LIST + CREATE
router.get("/", auth, c.listMyBanks);
router.post("/", auth, c.createBank);

// DETAIL
router.get("/:id", auth, requireBankRole(["owner", "editor", "viewer"]), c.getBankDetail);
router.patch("/:id", auth, requireBankRole(["owner", "editor"]), c.updateBank);

// ✅ STRUCTURE (đúng endpoint frontend đang gọi)
router.get(
  "/:id/structure",
  auth,
  requireBankRole(["owner", "editor", "viewer"]),
  c.getStructure
);

router.put(
  "/:id/structure",
  auth,
  requireBankRole(["owner", "editor"]),
  c.saveStructure
);
// PREVIEW DOCX
router.get(
  "/:id/structure/preview",
  auth,
  requireBankRole(["owner", "editor", "viewer"]),
  c.previewStructureDocx
);

// APPLY -> tạo folder (structureNodes)
router.post(
  "/:id/structure/apply",
  auth,
  requireBankRole(["owner", "editor"]),
  c.applyStructureFromDocx
);

module.exports = router;
