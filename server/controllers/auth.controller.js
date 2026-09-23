const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const { sendPasswordResetEmail } = require("../utils/email");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { cookieOptions } = require("../utils/cookies");
const { normalizeEmail } = require("../utils/normalize");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function register(req, res) {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (name.length < 2 || name.length > 80) return res.status(400).json({ message: "Name must contain 2–80 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email." });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ message: "Password must contain 8–128 characters." });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  res.cookie(process.env.COOKIE_NAME || "devnotes_token", signToken(user._id), cookieOptions());
  res.status(201).json({ user: publicUser(user) });
}

async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) return res.status(401).json({ message: "Invalid email or password." });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid email or password." });

  res.cookie(process.env.COOKIE_NAME || "devnotes_token", signToken(user._id), cookieOptions());
  res.json({ user: publicUser(user) });
}


async function changePassword(req, res) {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Please fill in all password fields." });
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ message: "Password must contain 8–128 characters." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New passwords do not match." });
  }

  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) return res.status(401).json({ message: "Authentication required." });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Current password is incorrect." });

  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (samePassword) {
    return res.status(400).json({ message: "New password must be different from your current password." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  // A successful password change also invalidates any unused reset link.
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  return res.json({ message: "Password changed successfully." });
}

async function logout(req, res) {
  res.clearCookie(process.env.COOKIE_NAME || "devnotes_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    path: "/"
  });
  res.json({ message: "Logged out." });
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}


function normalizeResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body.email);

  // Always return the same response so the endpoint does not reveal whether an account exists.
  const genericResponse = {
    message: "If an account exists for that email, password reset instructions have been sent."
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.json(genericResponse);
  }

  const user = await User.findOne({ email }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");
  if (!user) return res.json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = normalizeResetToken(rawToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // Password-reset links must open on the public frontend.
  const resetOrigin = String(
    process.env.RESET_PASSWORD_ORIGIN || process.env.CLIENT_ORIGIN ||
    `http://127.0.0.1:${process.env.PORT || 5000}`
  ).trim().replace(/\/$/, "");
  const resetUrl = `${resetOrigin}/reset-password.html?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresMinutes: 30
    });
  } catch (error) {
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save({ validateBeforeSave: false });
    throw error;
  }

  return res.json(genericResponse);
}

async function resetPassword(req, res) {
  const token = String(req.body.token || "").trim();
  const password = String(req.body.password || "");

  if (!/^[a-f0-9]{64}$/i.test(token)) return res.status(400).json({ message: "This password reset link is invalid or expired." });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ message: "Password must contain 8–128 characters." });

  const tokenHash = normalizeResetToken(token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() }
  }).select("+passwordHash +resetPasswordTokenHash +resetPasswordExpiresAt");

  if (!user) return res.status(400).json({ message: "This password reset link is invalid or expired." });

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  return res.json({ message: "Password updated successfully. You can now sign in with your new password." });
}

module.exports = { register, login, logout, me, forgotPassword, resetPassword, changePassword };
