const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 300,
    },
    profilePic: {
      type: String,
      default: "https://i.ibb.co/2FsfXqM/default-avatar.png",
    },
    reels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reel",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Partner", partnerSchema);