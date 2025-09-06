const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  registerPartner,
  loginPartner,
  logoutPartner,
} = require("../controllers/auth.controller");

const router = express.Router();

// =====================
// User Auth Routes
// =====================
router.post("/user/register", registerUser);
router.post("/user/login", loginUser);
router.get("/user/logout", logoutUser);

// =====================
// Partner Auth Routes
// =====================
router.post("/partner/register", registerPartner);
router.post("/partner/login", loginPartner);
router.get("/partner/logout", logoutPartner);

module.exports = router;