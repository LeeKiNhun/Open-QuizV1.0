const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const quizController = require("../controllers/quizController");

router.post("/", auth, quizController.createQuiz);
router.get("/", auth, quizController.getAllQuizzes);
router.get("/:id", auth, quizController.getQuizById);

module.exports = router;