const mongoose = require("mongoose");
const Note = require("../models/Note");
const NoteVersion = require("../models/NoteVersion");
const { normalizeTags } = require("../utils/normalize");

function ownerFilter(req) {
  return { owner: req.user._id };
}

const NOTE_TYPES = ["Concept", "Snippet", "Debugging", "Command", "Resource", "Idea", "Reference"];

function versionSnapshot(note, owner, reason = "edit") {
  return {
    note: note._id,
    owner,
    title: note.title || "Untitled note",
    content: note.content || "",
    type: note.type || "Concept",
    category: note.category || "Programming",
    tags: Array.isArray(note.tags) ? [...note.tags] : [],
    pinned: !!note.pinned,
    favorite: !!note.favorite,
    archived: !!note.archived,
    trashed: !!note.trashed,
    reason
  };
}

async function trimVersions(noteId, owner) {
  const versions = await NoteVersion.find({ note: noteId, owner })
    .sort({ createdAt: -1 })
    .select({ _id: 1 })
    .lean();
  if (versions.length > 50) {
    const ids = versions.slice(50).map(v => v._id);
    await NoteVersion.deleteMany({ _id: { $in: ids } });
  }
}

async function listNotes(req, res) {
  const {
    q = "",
    type,
    category,
    tag,
    view = "active",
    sort = "latest"
  } = req.query;

  const filter = ownerFilter(req);
  const safeQuery = String(q).trim().slice(0, 120);
  const allowedViews = ["active", "trash", "archive", "favorites", "pinned"];
  if (!allowedViews.includes(view)) return res.status(400).json({ message: "Invalid note view." });

  if (view === "trash") filter.trashed = true;
  else if (view === "archive") {
    filter.archived = true;
    filter.trashed = false;
  } else {
    filter.archived = false;
    filter.trashed = false;
    if (view === "favorites") filter.favorite = true;
    if (view === "pinned") filter.pinned = true;
  }

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (tag) filter.tags = tag;

  if (safeQuery) {
    filter.$text = { $search: safeQuery };
  }

  const sortMap = {
    latest: { updatedAt: -1 },
    oldest: { updatedAt: 1 },
    title: { title: 1 }
  };

  const notes = await Note.find(filter).sort(sortMap[sort] || sortMap.latest).lean();
  res.json({ notes });
}

async function getNote(req, res) {
  const note = await Note.findOne({ _id: req.params.id, ...ownerFilter(req) }).lean();
  if (!note) return res.status(404).json({ message: "Note not found." });
  res.json({ note });
}

async function createNote(req, res) {
  const title = String(req.body.title || "").trim().slice(0, 180);
  if (!title) return res.status(400).json({ message: "A note title is required." });
  const content = String(req.body.content || "");
  const type = NOTE_TYPES.includes(req.body.type) ? req.body.type : "Concept";
  const category = String(req.body.category || "Programming").trim().slice(0, 80) || "Programming";
  const note = await Note.create({
    owner: req.user._id, title, content, type, category, tags: normalizeTags(req.body.tags),
    pinned: !!req.body.pinned, favorite: !!req.body.favorite, archived: !!req.body.archived, trashed: !!req.body.trashed
  });

  await NoteVersion.create(versionSnapshot(note, req.user._id, "edit"));
  res.status(201).json({ note });
}

async function updateNote(req, res) {
  const allowed = ["title", "content", "type", "category", "tags", "pinned", "favorite", "archived", "trashed"];
  const update = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      update[key] = key === "tags" ? normalizeTags(req.body[key]) : req.body[key];
    }
  }

  // Moving a note to trash or archive clears the other state.
  if (update.trashed === true) update.archived = false;
  if (update.archived === true) update.trashed = false;

  const existing = await Note.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!existing) return res.status(404).json({ message: "Note not found." });

  const changed = Object.keys(update).some(key => {
    const before = existing[key];
    const after = update[key];
    if (Array.isArray(before) || Array.isArray(after)) return JSON.stringify(before || []) !== JSON.stringify(after || []);
    return String(before ?? "") !== String(after ?? "");
  });

  if (changed) {
    await NoteVersion.create(versionSnapshot(existing, req.user._id, "edit"));
  }

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, ...ownerFilter(req) },
    update,
    { new: true, runValidators: true }
  );

  if (!note) return res.status(404).json({ message: "Note not found." });
  if (changed) await trimVersions(note._id, req.user._id);
  res.json({ note });
}

async function listVersions(req, res) {
  const note = await Note.findOne({ _id: req.params.id, ...ownerFilter(req) }).select("_id").lean();
  if (!note) return res.status(404).json({ message: "Note not found." });

  const versions = await NoteVersion.find({ note: note._id, owner: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ versions });
}

async function restoreVersion(req, res) {
  const note = await Note.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!note) return res.status(404).json({ message: "Note not found." });

  const version = await NoteVersion.findOne({ _id: req.params.versionId, note: note._id, owner: req.user._id }).lean();
  if (!version) return res.status(404).json({ message: "Version not found." });

  await NoteVersion.create(versionSnapshot(note, req.user._id, "restore"));

  note.title = version.title;
  note.content = version.content;
  note.type = version.type;
  note.category = version.category;
  note.tags = version.tags || [];
  note.pinned = !!version.pinned;
  note.favorite = !!version.favorite;
  note.archived = !!version.archived;
  note.trashed = !!version.trashed;
  await note.save();
  await trimVersions(note._id, req.user._id);

  res.json({ note, message: "Previous version restored." });
}

async function deleteNote(req, res) {
  const hardDelete = req.query.permanent === "true";

  const note = hardDelete
    ? await Note.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) })
    : await Note.findOneAndUpdate(
        { _id: req.params.id, ...ownerFilter(req) },
        { trashed: true, archived: false },
        { new: true }
      );

  if (!note) return res.status(404).json({ message: "Note not found." });
  if (hardDelete) await NoteVersion.deleteMany({ note: note._id, owner: req.user._id });
  res.json({ message: hardDelete ? "Note permanently deleted." : "Note moved to trash.", note });
}

async function categories(req, res) {
  const rows = await Note.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id), trashed: false, archived: false } },
    { $match: { category: { $nin: [null, ""] } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  res.json({ categories: rows.map((r) => ({ name: r._id, count: r.count })) });
}

async function tags(req, res) {
  const rows = await Note.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id), trashed: false, archived: false } },
    { $unwind: "$tags" },
    { $match: { tags: { $nin: [null, ""] } } },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } }
  ]);

  res.json({ tags: rows.map((r) => ({ name: r._id, count: r.count })) });
}



function pdfEscape(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function wrapPdfText(value, maxChars = 92) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (word.length > maxChars) {
      if (line) { lines.push(line); line = ""; }
      for (let i = 0; i < word.length; i += maxChars) lines.push(word.slice(i, i + maxChars));
      continue;
    }
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function buildSimplePdf(notes = []) {
  const pageWidth = 612, pageHeight = 792;
  const margin = 48, contentWidth = 92;
  const pages = [];
  let lines = [];
  const addLine = (text = "", size = 10, bold = false) => lines.push({ text, size, bold });
  const addNote = (note, index) => {
    if (index > 0) addLine("", 10, false);
    addLine(note.title || "Untitled note", 18, true);
    addLine(`Type: ${note.type || "Concept"}    Category: ${note.category || "Programming"}`, 9, false);
    if (Array.isArray(note.tags) && note.tags.length) addLine(`Tags: ${note.tags.join(", ")}`, 9, false);
    addLine("", 8, false);
    String(note.content || "").split(/\r?\n/).forEach(raw => {
      const text = raw.trimEnd();
      if (!text) { addLine("", 10, false); return; }
      wrapPdfText(text.replace(/\t/g, "    "), contentWidth).forEach(part => addLine(part, 10, false));
    });
    addLine("", 8, false);
    addLine(`Updated: ${note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "—"}`, 8, false);
  };
  notes.forEach(addNote);
  let pageLines = [], used = 0;
  const lineHeight = (size) => Math.max(12, size + 4);
  for (const line of lines) {
    const h = lineHeight(line.size);
    if (used + h > pageHeight - 72) { pages.push(pageLines); pageLines = []; used = 0; }
    pageLines.push(line); used += h;
  }
  if (!pageLines.length) pageLines.push({text:"No notes found.",size:12,bold:false});
  pages.push(pageLines);

  const objects = [];
  const offsets = [];
  const addObj = body => { objects.push(body); return objects.length; };
  const catalogId = addObj(null), pagesId = addObj(null);
  const fontId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];
  const contentIds = [];
  pages.forEach(page => {
    const commands = ["BT", `/F1 10 Tf`, `${margin} ${pageHeight - margin} Td`];
    let first = true;
    for (const line of page) {
      if (!first) commands.push(`0 -${lineHeight(line.size)} Td`);
      first = false;
      commands.push(`/F${line.bold ? 2 : 1} ${line.size} Tf`);
      commands.push(`(${pdfEscape(line.text)}) Tj`);
    }
    commands.push("ET");
    const stream = commands.join("\n");
    const contentId = addObj(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
    const pageId = addObj(null);
    contentIds.push(contentId); pageIds.push(pageId);
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  pageIds.forEach((id, i) => { objects[id - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`; });
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  objects.forEach((obj, i) => { offsets[i + 1] = Buffer.byteLength(pdf, "binary"); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

async function exportPdf(req, res) {
  const notes = await Note.find(ownerFilter(req))
    .sort({ updatedAt: -1 })
    .select("title content type category tags createdAt updatedAt")
    .lean();
  const pdf = buildSimplePdf(notes);
  const date = new Date().toISOString().slice(0, 10);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="devnotes-backup-${date}.pdf"`, "Content-Length": pdf.length });
  res.send(pdf);
}

async function exportNotePdf(req, res) {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user._id })
    .select("title content type category tags createdAt updatedAt")
    .lean();
  if (!note) return res.status(404).json({ message: "Note not found." });
  const pdf = buildSimplePdf([note]);
  const safeTitle = String(note.title || "devnotes-note").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 90) || "devnotes-note";
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`, "Content-Length": pdf.length });
  res.send(pdf);
}

async function exportNotes(req, res) {
  const notes = await Note.find(ownerFilter(req))
    .sort({ updatedAt: -1 })
    .select("title content type category tags pinned favorite archived trashed createdAt updatedAt")
    .lean();

  res.json({
    app: "DevNotes",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    noteCount: notes.length,
    notes
  });
}

async function importNotes(req, res) {
  const incoming = Array.isArray(req.body?.notes) ? req.body.notes : [];
  if (!incoming.length) return res.status(400).json({ message: "No notes were found in the backup." });
  if (incoming.length > 500) return res.status(400).json({ message: "A maximum of 500 notes can be imported at once." });

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let index = 0; index < incoming.length; index++) {
    const raw = incoming[index] || {};
    const title = String(raw.title || "").trim().slice(0, 180);
    if (!title) { errors.push(`Note ${index + 1}: missing title`); continue; }

    const content = String(raw.content || "");
    const type = ["Concept", "Snippet", "Debugging", "Command", "Resource", "Idea", "Reference"].includes(raw.type) ? raw.type : "Concept";
    const category = String(raw.category || "Programming").trim().slice(0, 80) || "Programming";
    const tags = normalizeTags(raw.tags);
    const duplicate = await Note.findOne({ owner: req.user._id, title, content, type, category }).select("_id").lean();
    if (duplicate) { skipped++; continue; }

    try {
      const note = await Note.create({
        owner: req.user._id, title, content, type, category, tags,
        pinned: !!raw.pinned, favorite: !!raw.favorite, archived: !!raw.archived, trashed: !!raw.trashed
      });
      await NoteVersion.create(versionSnapshot(note, req.user._id, "import"));
      await trimVersions(note._id, req.user._id);
      imported++;
    } catch (error) {
      errors.push(`Note ${index + 1}: ${error.message || "could not import"}`);
    }
  }

  res.status(201).json({ imported, skipped, failed: errors.length, errors });
}

module.exports = { listNotes, getNote, createNote, updateNote, deleteNote, listVersions, restoreVersion, categories, tags, exportNotes, exportPdf, exportNotePdf, importNotes };
