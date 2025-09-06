const ImageKit = require("imagekit");
const Reel = require("../models/reels.model");

// ✅ Configure ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// 📌 Upload Reel (Partner only)
const uploadReel = async (req, res) => {
  try {
    const { video, caption, price } = req.body;

    if (!video || !price) {
      return res.status(400).json({ message: "Video and price are required" });
    }

    // Set timeout for upload
    const uploadPromise = imagekit.upload({
      file: video,
      fileName: `reel_${Date.now()}.mp4`,
      folder: "/reels",
      timeout: 60000, // 60 seconds timeout
    });

    const uploadResponse = await Promise.race([
      uploadPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 60000)
      )
    ]);

    const reel = await Reel.create({
      partner: req.user.id,
      videoUrl: uploadResponse.url,
      caption,
      price,
    });

    // Populate partner info before sending response
    await reel.populate("partner", "name brandName");

    res.status(201).json({ message: "Reel uploaded successfully", reel });
  } catch (error) {
    console.error("Upload Reel Error:", error);
    
    if (error.message === 'Upload timeout') {
      return res.status(408).json({ message: "Upload timeout. Please try with a smaller file." });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: "File too large. Maximum size is 50MB." });
    }
    
    res.status(500).json({ message: "Server error during upload" });
  }
};

// 📌 Get all reels (feed) with pagination
const getReels = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const totalReels = await Reel.countDocuments();
    const reels = await Reel.find()
      .populate("partner", "name email")
      .populate("comments.user", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      totalReels,
      currentPage: page,
      totalPages: Math.ceil(totalReels / limit),
      reels,
    });
  } catch (error) {
    console.error("Get Reels Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Get reels by partner (for authenticated partner's own reels)
const getPartnerReels = async (req, res) => {
  try {
    const reels = await Reel.find({ partner: req.user.id })
      .populate("partner", "name email brandName")
      .populate("comments.user", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(reels);
  } catch (error) {
    console.error("Get Partner Reels Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Toggle Like/Unlike
const toggleLikeReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const userId = req.user.id;
    const index = reel.likes.indexOf(userId);

    if (index === -1) {
      reel.likes.push(userId);
      await reel.save();
    } else {
      reel.likes.splice(index, 1);
      await reel.save();
    }

    // Populate partner info before returning
    await reel.populate("partner", "name brandName");
    
    return res.status(200).json({ 
      message: index === -1 ? "Reel liked" : "Reel unliked", 
      reel 
    });
  } catch (error) {
    console.error("Toggle Like Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Toggle Save/Unsave
const toggleSaveReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const userId = req.user.id;
    const index = reel.saves.indexOf(userId);

    if (index === -1) {
      reel.saves.push(userId);
      await reel.save();
    } else {
      reel.saves.splice(index, 1);
      await reel.save();
    }

    // Populate partner info before returning
    await reel.populate("partner", "name brandName");
    
    return res.status(200).json({ 
      message: index === -1 ? "Reel saved" : "Reel unsaved", 
      reel 
    });
  } catch (error) {
    console.error("Toggle Save Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Add Comment
const addComment = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ message: "Comment text required" });

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const comment = { user: req.user.id, text };
    reel.comments.push(comment);
    await reel.save();

    await reel.populate("comments.user", "username email");

    res.status(201).json({ message: "Comment added", reel });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Delete reel (partner only)
const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const reel = await Reel.findOne({ _id: reelId, partner: req.user.id });
    
    if (!reel) {
      return res.status(404).json({ message: "Reel not found or not authorized" });
    }
    
    await Reel.findByIdAndDelete(reelId);
    res.status(200).json({ message: "Reel deleted successfully" });
  } catch (error) {
    console.error("Delete Reel Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Update reel (partner only)
const updateReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { caption, price } = req.body;
    
    const reel = await Reel.findOne({ _id: reelId, partner: req.user.id });
    
    if (!reel) {
      return res.status(404).json({ message: "Reel not found or not authorized" });
    }
    
    const updatedReel = await Reel.findByIdAndUpdate(
      reelId,
      { caption, price },
      { new: true, runValidators: true }
    ).populate("partner", "name email brandName");
    
    res.status(200).json(updatedReel);
  } catch (error) {
    console.error("Update Reel Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  uploadReel,
  getReels,
  getPartnerReels,
  toggleLikeReel,
  toggleSaveReel,
  addComment,
  deleteReel,
  updateReel,
};