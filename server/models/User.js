const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
      default: null
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    avatar: {
      type: String,
      default: ""
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light"
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
