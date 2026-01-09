const router = require("express").Router();
const BookTemplate = require("../models/BookTemplate");

router.get("/books", async (req, res) => {
  const items = await BookTemplate.find({ status: "published" })
    .select("bookId title grade subject version")
    .sort({ grade: 1, title: 1 })
    .lean();
  res.json({ ok: true, items });
});

router.get("/books/:bookId", async (req, res) => {
  const item = await BookTemplate.findOne({ bookId: req.params.bookId }).lean();
  if (!item) return res.status(404).json({ ok: false, message: "Book not found" });
  res.json({ ok: true, item });
});

module.exports = router;
