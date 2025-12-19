// backend/src/controllers/adminController.js

exports.getAllUsers = async (req, res, next) => {
  try {
    return res.json({ message: "Admin getAllUsers OK (stub)", items: [] });
  } catch (err) {
    next(err);
  }
};

exports.lockUser = async (req, res, next) => {
  try {
    return res.json({ message: "Admin lockUser OK (stub)", userId: req.params.id });
  } catch (err) {
    next(err);
  }
};