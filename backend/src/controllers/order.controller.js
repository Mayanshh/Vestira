const Order = require("../models/order.model");
const Reel = require("../models/reels.model");

// 📌 Place an order (User)
const placeOrder = async (req, res) => {
  try {
    const { reelId, quantity, customerInfo, notes, totalAmount } = req.body;

    // Validate required fields
    if (!reelId || !quantity || !customerInfo || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({ message: "Customer name, email, and phone are required" });
    }

    // Check reel exists
    const reel = await Reel.findById(reelId).populate("partner", "name brandName");
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    // Verify total amount calculation
    const expectedTotal = reel.price * quantity;
    if (Math.abs(totalAmount - expectedTotal) > 0.01) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    const order = await Order.create({
      user: req.user.id,
      reel: reelId,
      quantity,
      customerInfo,
      notes: notes || '',
      totalAmount,
    });

    // Populate the order with reel and partner details for response
    const populatedOrder = await Order.findById(order._id)
      .populate("reel", "videoUrl caption price")
      .populate({
        path: "reel",
        populate: {
          path: "partner",
          select: "name brandName"
        }
      });

    res.status(201).json({
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Place Order Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Get all orders of a user
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("reel", "videoUrl caption price")
      .populate({
        path: "reel",
        populate: {
          path: "partner",
          select: "name brandName"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get User Orders Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Partner updates order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate("reel");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the partner of that reel can update
    if (order.reel.partner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Partner gets all orders for their reels
const getPartnerOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "reel",
        match: { partner: req.user.id }, // only reels uploaded by this partner
        populate: { path: "partner", select: "name brandName email" },
      })
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    // Remove orders not belonging to this partner
    const partnerOrders = orders.filter((order) => order.reel !== null);

    res.status(200).json(partnerOrders);
  } catch (error) {
    console.error("Get Partner Orders Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
  updateOrderStatus,
  getPartnerOrders,
};