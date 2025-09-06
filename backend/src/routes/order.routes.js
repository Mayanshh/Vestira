const express = require("express");
const {
  placeOrder,
  getUserOrders,
  updateOrderStatus,
  getPartnerOrders,
} = require("../controllers/order.controller");

const authMiddleware = require("../middleware/auth.middleware");
const isPartner = require("../middleware/isPartner");

const router = express.Router();

// ✅ User places an order
router.post("/", authMiddleware, placeOrder);

// ✅ User gets all his orders
router.get("/", authMiddleware, getUserOrders);

// ✅ Partner updates order status
router.patch("/:orderId/status", authMiddleware, isPartner, updateOrderStatus);

// ✅ Partner sees all orders for their reels
router.get("/partner", authMiddleware, isPartner, getPartnerOrders);

module.exports = router;