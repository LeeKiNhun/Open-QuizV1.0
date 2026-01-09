// backend/src/models/BookTemplate.js
const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },       // u1_a
    code: { type: String, required: true },     // A/B/C/D
    title: { type: String, required: true },
  },
  { _id: false }
);

const UnitSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },       // u1
    title: { type: String, required: true },
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: false }
);

const BookTemplateSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    grade: { type: Number },
    subject: { type: String },
    units: { type: [UnitSchema], default: [] },
    version: { type: Number, default: 1 },
    status: { type: String, default: "published" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookTemplate", BookTemplateSchema);
