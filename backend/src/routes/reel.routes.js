const express = require("express");
const {
  uploadReel,
  getReels,
  toggleLikeReel,
  toggleSaveReel,
  addComment,
  getPartnerReels,
  deleteReel,
  updateReel,
} = require("../controllers/reel.controller");

const authMiddleware = require("../middleware/auth.middleware");
const isPartner = require("../middleware/isPartner");

const router = express.Router();

// Partner uploads reel
router.post("/upload", authMiddleware, isPartner, uploadReel);

// Get partner's own reels
router.get("/partner", authMiddleware, isPartner, getPartnerReels);

// Get all reels
router.get("/", getReels);

// Like / Unlike reel
router.post("/:reelId/like", authMiddleware, toggleLikeReel);

// Save / Unsave reel
router.post("/:reelId/save", authMiddleware, toggleSaveReel);

// Add comment
router.post("/:reelId/comment", authMiddleware, addComment);

// Delete reel (partner only)
router.delete("/:reelId", authMiddleware, isPartner, deleteReel);

// Update reel (partner only)
router.put("/:reelId", authMiddleware, isPartner, updateReel);

module.exports = router;