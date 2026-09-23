const mongoose = require("mongoose");

const noteVersionSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: { type: String, default: "Untitled note", maxlength: 180 },
    content: { type: String, default: "" },
    type: { type: String, default: "Concept" },
    category: { type: String, default: "Programming", maxlength: 80 },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    trashed: { type: Boolean, default: false },
    reason: { type: String, enum: ["edit", "restore", "import"], default: "edit" }
  },
  { timestamps: true }
);

noteVersionSchema.index({ note: 1, createdAt: -1 });

module.exports = mongoose.model("NoteVersion", noteVersionSchema);
