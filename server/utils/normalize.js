function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 20);
  }

  return [...new Set(
    String(tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  )].slice(0, 20);
}

module.exports = { normalizeEmail, normalizeTags };
