// backend/tools/importSeedQuestions.mjs
import fs from "fs";
import path from "path";
import process from "process";
import mongoose from "mongoose";

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const bankId = getArg("bankId");
const file = getArg("file", path.resolve(process.cwd(), "seed_questions.json"));
const wipe = getArg("wipe", "false") === "true";

if (!bankId) {
  console.error("❌ Missing --bankId");
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error("❌ File not found:", file);
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/openquiz";

// Minimal Question schema matching your model
const QuestionSchema = new mongoose.Schema(
  {
    bank: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionBank", required: true },
    code: { type: String, required: true },
    type: { type: String, default: "mcq" },
    content: { type: String, required: true },
    choices: { type: [String], default: [] },
    answer: { type: Object, default: {} },
    explanation: { type: String, default: "" },
    structureNodeId: { type: String, default: null },
    difficulty: { type: String, default: "" },
    tags: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "questions" } // thường là "questions"
);

QuestionSchema.index({ bank: 1, code: 1 }, { unique: true });

const Question = mongoose.model("QuestionSeed", QuestionSchema);

(async () => {
  await mongoose.connect(MONGO_URI);

  const raw = fs.readFileSync(file, "utf8");
  let items;
  try {
    items = JSON.parse(raw);
  } catch (e) {
    console.error("❌ JSON parse failed. File is not valid JSON.");
    console.error("Hint: file must be an ARRAY like: [ {..}, {..} ]");
    process.exit(1);
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.error("❌ Seed is empty or not an array");
    process.exit(1);
  }

  const bankObjectId = new mongoose.Types.ObjectId(bankId);

  if (wipe) {
    const r = await Question.deleteMany({ bank: bankObjectId });
    console.log(`🧹 Wiped existing questions: ${r.deletedCount}`);
  }

  const docs = items.map((q) => ({
    ...q,
    bank: bankObjectId,
    type: q.type || "mcq",
    isDeleted: false,
  }));

  // ordered:false để skip duplicate code thay vì chết cả batch
  const inserted = await Question.insertMany(docs, { ordered: false });

  console.log(`✅ Imported: ${inserted.length}/${docs.length}`);
  console.log("Done.");

  await mongoose.disconnect();
})();
