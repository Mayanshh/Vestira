const User = require("../models/user.model");
const Partner = require("../models/partner.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/*
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/*
 * Set cookie with token
 */
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/* ======================
   USER AUTH CONTROLLERS
   ====================== */

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    // console.error("Register User error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    // console.error("Login User error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT USER
const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logout successful" });
};

/* ======================
   PARTNER AUTH CONTROLLERS
   ====================== */

// REGISTER PARTNER
const registerPartner = async (req, res) => {
  try {
    const { name, email, password, brandName, description } = req.body;

    if (!name || !email || !password || !brandName) {
      return res.status(400).json({ message: "Name, email, password, and brand name are required" });
    }

    const existingPartner = await Partner.findOne({ email });
    if (existingPartner) {
      return res.status(400).json({ message: "Partner already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const partner = await Partner.create({
      name,
      email,
      password: hashedPassword,
      brandName,
      description: description || '',
    });

    const token = generateToken(partner._id);
    setTokenCookie(res, token);

    res.status(201).json({
      message: "Partner registered successfully",
      partner: { 
        id: partner._id, 
        name: partner.name, 
        email: partner.email,
        brandName: partner.brandName,
        description: partner.description
      },
      token,
    });
  } catch (error) {
    // console.error("Register Partner error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN PARTNER
const loginPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const partner = await Partner.findOne({ email });
    if (!partner) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(partner._id);
    setTokenCookie(res, token);

    res.json({
      message: "Login successful",
      partner: { id: partner._id, name: partner.name, email: partner.email },
      token,
    });
  } catch (error) {
    // console.error("Login Partner error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT PARTNER
const logoutPartner = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logout successful" });
};

// GET PARTNER PROFILE
const getPartnerProfile = async (req, res) => {
  try {
    const partner = await Partner.findById(req.user.id).select('-password');
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }
    res.status(200).json(partner);
  } catch (error) {
    console.error("Get Partner Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE PARTNER PROFILE
const updatePartnerProfile = async (req, res) => {
  try {
    const { name, brandName, description } = req.body;
    
    const partner = await Partner.findByIdAndUpdate(
      req.user.id,
      { name, brandName, description },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }
    
    res.status(200).json(partner);
  } catch (error) {
    console.error("Update Partner Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET PARTNER ANALYTICS
const getPartnerAnalytics = async (req, res) => {
  try {
    const Partner = require("../models/partner.model");
    const Reel = require("../models/reels.model");
    const Order = require("../models/order.model");
    
    const partner = await Partner.findById(req.user.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }
    
    // Get partner's reels with analytics
    const reels = await Reel.find({ partner: req.user.id });
    const totalReels = reels.length;
    const totalLikes = reels.reduce((sum, reel) => sum + (reel.likes?.length || 0), 0);
    const totalSaves = reels.reduce((sum, reel) => sum + (reel.saves?.length || 0), 0);
    
    // Get orders for partner's reels
    const orders = await Order.find({ 
      reel: { $in: reels.map(r => r._id) } 
    }).populate('reel', 'caption price');
    
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const analytics = {
      totalReels,
      totalLikes,
      totalSaves,
      totalOrders,
      totalRevenue,
      recentOrders: orders.slice(0, 5), // Last 5 orders
    };
    
    res.status(200).json(analytics);
  } catch (error) {
    console.error("Get Partner Analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  registerPartner,
  loginPartner,
  logoutPartner,
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerAnalytics,
};