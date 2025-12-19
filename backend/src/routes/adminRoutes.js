const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// Admin actions
router.get("/users", adminController.getAllUsers);
router.post("/lock-user/:id", adminController.lockUser);

module.exports = router;