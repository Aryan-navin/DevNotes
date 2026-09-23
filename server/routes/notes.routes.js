const router = require("express").Router();
const {
  listNotes, getNote, createNote, updateNote, deleteNote, listVersions, restoreVersion, categories, tags, exportNotes, exportPdf, exportNotePdf, importNotes
} = require("../controllers/notes.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.use(requireAuth);
router.get("/", listNotes);
router.get("/categories", categories);
router.get("/tags", tags);
router.get("/export", exportNotes);
router.get("/export.pdf", exportPdf);
router.post("/import", importNotes);
router.get("/:id/versions", listVersions);
router.post("/:id/versions/:versionId/restore", restoreVersion);
router.get("/:id/pdf", exportNotePdf);
router.get("/:id", getNote);
router.post("/", createNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;
