// backend/src/controllers/attemptController.js
const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

exports.startAttempt = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { quizId } = req.body;

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({ ok: false, message: "quizId không hợp lệ" });
    }

    const quiz = await Quiz.findById(quizId).select("_id questionIds").lean();
    if (!quiz) return res.status(404).json({ ok: false, message: "Quiz not found" });

    // Nếu đã có attempt in_progress thì reuse
    let attempt = await Attempt.findOne({ quiz: quizId, user: userId, status: "in_progress" }).lean();
    if (attempt) return res.json({ ok: true, item: attempt, reused: true });

    attempt = await Attempt.create({
      quiz: quizId,
      user: userId,
      status: "in_progress",
      total: quiz.questionIds?.length || 0,
    });

    return res.json({ ok: true, item: attempt, reused: false });
  } catch (e) {
    console.error("startAttempt error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.submitAttempt = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { attemptId } = req.params;
    const { answers = [] } = req.body;

    if (!mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json({ ok: false, message: "attemptId không hợp lệ" });
    }
    if (!Array.isArray(answers)) {
      return res.status(400).json({ ok: false, message: "answers phải là array" });
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ ok: false, message: "Attempt not found" });

    if (String(attempt.user) !== String(userId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    if (attempt.status === "submitted") {
      return res.status(400).json({ ok: false, message: "Attempt already submitted" });
    }

    const quiz = await Quiz.findById(attempt.quiz).select("_id questionIds").lean();
    if (!quiz) return res.status(404).json({ ok: false, message: "Quiz not found" });

    const quizQIds = new Set((quiz.questionIds || []).map((x) => String(x)));

    // lọc answer hợp lệ (chỉ câu trong quiz)
    const cleaned = answers
      .filter((a) => a?.questionId && quizQIds.has(String(a.questionId)) && Number.isInteger(a.selectedIndex))
      .map((a) => ({ questionId: a.questionId, selectedIndex: a.selectedIndex }));

    const questions = await Question.find({ _id: { $in: cleaned.map((x) => x.questionId) } })
      .select("_id answer type")
      .lean();

    const ansMap = new Map(questions.map((q) => [String(q._id), q]));

    let score = 0;
    const finalAnswers = cleaned.map((a) => {
      const q = ansMap.get(String(a.questionId));
      const correct = Number(q?.answer?.correct);
      const isCorrect = Number.isInteger(correct) && a.selectedIndex === correct;
      if (isCorrect) score += 1;
      return { ...a, isCorrect };
    });

    attempt.answers = finalAnswers;
    attempt.score = score;
    attempt.total = quiz.questionIds?.length || finalAnswers.length;
    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    await attempt.save();

    return res.json({ ok: true, item: attempt });
  } catch (e) {
    console.error("submitAttempt error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.getAttemptById = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Bad id" });

    const attempt = await Attempt.findById(id).lean();
    if (!attempt) return res.status(404).json({ ok: false, message: "Attempt not found" });
    if (String(attempt.user) !== String(userId)) return res.status(403).json({ ok: false, message: "Forbidden" });

    return res.json({ ok: true, item: attempt });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
