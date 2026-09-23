async function getProfile(req, res) {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  });
}

async function updatePreferences(req, res) {
  const allowedThemes = ["light", "dark"];
  const theme = req.body.theme;

  if (theme && !allowedThemes.includes(theme)) {
    return res.status(400).json({ message: "Invalid theme." });
  }

  if (theme) req.user.preferences.theme = theme;
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ message: "Name must contain 2–80 characters." });
    }
    req.user.name = name;
  }

  await req.user.save();

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  });
}

module.exports = { getProfile, updatePreferences };
