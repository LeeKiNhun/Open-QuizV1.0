// backend/src/controllers/attemptController.js

exports.submitAttempt = async (req, res, next) => {
  try {
    return res.status(201).json({ message: "Submit attempt OK (stub)", data: req.body });
  } catch (err) {
    next(err);
  }
};

exports.getAttemptsByQuiz = async (req, res, next) => {
  try {
    return res.json({ message: "Get attempts by quiz OK (stub)", quizId: req.params.quizId, items: [] });
  } catch (err) {
    next(err);
  }
};