const express = require("express");
const { getUserProfile } = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Get user profile (liked + saved reels)
router.get("/profile", authMiddleware, getUserProfile);

module.exports = router;
