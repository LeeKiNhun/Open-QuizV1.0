// backend/src/controllers/quizController.js
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Quiz = require("../models/Quiz");

exports.generateQuiz = async (req, res) => {
  try {
    const { bankId, title, lessonIds = [], numQuestions = 20, shuffle = true } = req.body;

    if (!mongoose.isValidObjectId(bankId)) {
      return res.status(400).json({ ok: false, message: "bankId không hợp lệ" });
    }
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({ ok: false, message: "Missing lessonIds" });
    }

    const bankObjectId = new mongoose.Types.ObjectId(bankId);

    const query = {
      bank: bankObjectId,
      isDeleted: false,
      structureNodeId: { $in: lessonIds },
      type: "mcq",
    };

    let questions = await Question.find(query).select("_id").lean();

    if (!questions.length) {
      return res.status(400).json({ ok: false, message: "No questions found for selected lessons" });
    }

    if (shuffle) questions = questions.sort(() => Math.random() - 0.5);

    const k = Math.min(Number(numQuestions) || 20, questions.length);
    const picked = questions.slice(0, k);

    const quiz = await Quiz.create({
      bank: bankObjectId,
      title: title || `Quiz (${lessonIds.length} lessons)`,
      lessonIds,
      numQuestions: k,
      shuffle: !!shuffle,
      questionIds: picked.map((q) => q._id),
      createdBy: req.user?._id,
    });

    return res.json({ ok: true, item: quiz });
  } catch (e) {
    console.error("generateQuiz error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ ok: false, message: "Bad id" });

    // populate câu hỏi để TakeQuizPage render được
    const quiz = await Quiz.findById(id)
      .populate({
        path: "questionIds",
        select: "content choices type answer explanation structureNodeId",
      })
      .lean();

    if (!quiz) return res.status(404).json({ ok: false, message: "Quiz not found" });

    return res.json({ ok: true, item: quiz });
  } catch (e) {
    console.error("getById error:", e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
