const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    content: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      enum: ["Concept", "Snippet", "Debugging", "Command", "Resource", "Idea", "Reference"],
      default: "Concept"
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "Programming"
    },
    tags: {
      type: [String],
      default: []
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true
    },
    favorite: {
      type: Boolean,
      default: false,
      index: true
    },
    archived: {
      type: Boolean,
      default: false,
      index: true
    },
    trashed: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

noteSchema.index({ owner: 1, updatedAt: -1 });
noteSchema.index({ owner: 1, title: "text", content: "text", category: "text", tags: "text" });

module.exports = mongoose.model("Note", noteSchema);
