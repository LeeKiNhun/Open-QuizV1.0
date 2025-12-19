const express = require("express");
const router = express.Router();

const attemptController = require("../controllers/attemptController");

// Attempt
router.post("/", attemptController.submitAttempt);
router.get("/quiz/:quizId", attemptController.getAttemptsByQuiz);

module.exports = router;