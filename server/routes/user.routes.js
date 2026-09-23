const router = require("express").Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { getProfile, updatePreferences } = require("../controllers/user.controller");

router.use(requireAuth);
router.get("/profile", getProfile);
router.patch("/preferences", updatePreferences);

module.exports = router;
