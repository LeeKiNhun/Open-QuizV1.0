// backend/src/controllers/quizController.js

exports.createQuiz = async (req, res, next) => {
  try {
    return res.status(201).json({ message: "Create quiz OK (stub)", data: req.body });
  } catch (err) {
    next(err);
  }
};

exports.getAllQuizzes = async (req, res, next) => {
  try {
    return res.json({ message: "Get all quizzes OK (stub)", items: [] });
  } catch (err) {
    next(err);
  }
};

exports.getQuizById = async (req, res, next) => {
  try {
    return res.json({ message: "Get quiz by id OK (stub)", id: req.params.id });
  } catch (err) {
    next(err);
  }
};
