const express = require("express");
const {
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerAnalytics,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");
const isPartner = require("../middleware/isPartner");

const router = express.Router();

// Get partner profile
router.get("/profile", authMiddleware, isPartner, getPartnerProfile);

// Update partner profile
router.put("/profile", authMiddleware, isPartner, updatePartnerProfile);

// Get partner analytics
router.get("/analytics", authMiddleware, isPartner, getPartnerAnalytics);

module.exports = router;