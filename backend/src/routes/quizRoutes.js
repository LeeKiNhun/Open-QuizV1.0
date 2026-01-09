// backend/src/routes/quizRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const c = require("../controllers/quizController");

router.post("/generate", auth, c.generateQuiz);
router.get("/:id", auth, c.getById);

module.exports = router;
