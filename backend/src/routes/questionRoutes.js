const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const { requireBankRole } = require("../middlewares/requireRole");
const c = require("../controllers/questionController");

const multer = require("multer");
const upload = multer({ dest: "uploads/docx" });

/* ======================
   QUESTIONS (GIỮ NGUYÊN)
====================== */

router.get(
  "/:bankId/questions",
  auth,
  requireBankRole(["owner", "editor", "viewer"]),
  c.listQuestions
);

router.post(
  "/:bankId/questions",
  auth,
  requireBankRole(["owner", "editor"]),
  c.createQuestion
);

// import JSON questions (GIỮ NGUYÊN)
router.post(
  "/:bankId/questions/import",
  auth,
  requireBankRole(["owner", "editor"]),
  c.importQuestions
);

/* ======================
   STRUCTURE DOCX (MỚI)
====================== */
/**
 * Upload DOCX → parse → lưu structureDocxText
 * Sau đó FE sẽ điều hướng sang trang preview
 */
router.post(
  "/:bankId/structure/upload-docx",
  auth,
  requireBankRole(["owner", "editor"]),
  upload.single("file"),
  c.uploadStructureDocx
);

module.exports = router;
