const router = require("express").Router();
const { register, login, logout, me, forgotPassword, resetPassword, changePassword } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireAuth, changePassword);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

module.exports = router;
