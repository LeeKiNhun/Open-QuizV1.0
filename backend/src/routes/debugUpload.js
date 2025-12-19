const express = require("express");
const multer = require("multer");

const router = express.Router();
const mem = multer({ storage: multer.memoryStorage() });

router.post("/debug-upload", mem.single("pdf"), (req, res) => {
  console.log("[DEBUG_UPLOAD] HIT", req.originalUrl);
  console.log("[DEBUG_UPLOAD] content-type =", req.headers["content-type"]);
  console.log("[DEBUG_UPLOAD] file =", req.file?.originalname, req.file?.size);

  return res.json({
    ok: true,
    contentType: req.headers["content-type"],
    gotFile: !!req.file,
    fieldNameExpected: "pdf",
    fileName: req.file?.originalname || null,
    size: req.file?.size || null,
  });
});

module.exports = router;