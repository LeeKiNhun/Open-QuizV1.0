// backend/src/routes/attemptRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const c = require("../controllers/attemptController");

router.post("/start", auth, c.startAttempt);
router.post("/:attemptId/submit", auth, c.submitAttempt);
router.get("/:id", auth, c.getAttemptById);

module.exports = router;
