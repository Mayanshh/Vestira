const User = require("../models/user.model");
const Reel = require("../models/reels.model");

// 📌 Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user info
    const user = await User.findById(userId).select("username email");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch liked reels
    const likedReels = await Reel.find({ likes: userId })
      .populate("partner", "name brandName username email")
      .sort({ createdAt: -1 });

    // Fetch saved reels
    const savedReels = await Reel.find({ saves: userId })
      .populate("partner", "name brandName username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      user,
      likedReels,
      savedReels,
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserProfile,
};