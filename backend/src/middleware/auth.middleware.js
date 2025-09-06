const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Partner = require("../models/partner.model");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists in Users collection
    let account = await User.findById(decoded.id).select("-password");
    let role = "user";

    if (!account) {
      // If not found, check in Partners collection
      account = await Partner.findById(decoded.id).select("-password");
      role = "partner";
    }

    if (!account) {
      return res.status(401).json({ message: "Not authorized, account not found" });
    }

    // Attach to request object
    req.user = account;
    req.role = role;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

module.exports = authMiddleware;
