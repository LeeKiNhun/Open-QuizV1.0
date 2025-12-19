const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const c = require("../controllers/authControllers");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function signToken(user) {
  return jwt.sign(
    { role: user.vaiTro },
    process.env.JWT_SECRET,
    { subject: String(user._id), expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

router.post("/register", c.register);
router.post("/login", c.login);
router.get("/me", auth, c.me);

// GOOGLE
// GOOGLE
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account", // ✅ CHỈ THÊM DÒNG NÀY
  })
);


router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?oauth=failed`,
  }),
  (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

// MICROSOFT
router.get("/microsoft", passport.authenticate("microsoft", { session: false }));

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?oauth=failed`,
  }),
  (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

module.exports = router;