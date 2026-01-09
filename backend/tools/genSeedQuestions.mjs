// backend/tools/genSeedQuestions.mjs
import fs from "fs";
import path from "path";
import process from "process";
import mongoose from "mongoose";

// ====== args helper ======
function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const bankId = getArg("bankId");
const perLesson = Number(getArg("perLesson", "100"));
const outFile = getArg("out", path.resolve(process.cwd(), "seed_questions.json"));

if (!bankId) {
  console.error("❌ Missing --bankId");
  console.error("Example: node tools/genSeedQuestions.mjs --bankId <BANK_ID> --perLesson 100 --out seed_questions.json");
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/openquiz";

// ====== minimal schema load (khỏi require project ESM/CJS lằng nhằng) ======
const QuestionBankSchema = new mongoose.Schema(
  {
    structureNodes: [{ id: String, parentId: String, title: String, type: String, order: Number }],
  },
  { collection: "questionbanks" } // ⚠️ nếu collection khác, bạn đổi lại
);

const QuestionBank = mongoose.model("QuestionBankSeed", QuestionBankSchema);

function pad(n, width = 3) {
  const s = String(n);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function makeChoices() {
  return ["A", "B", "C", "D"];
}

function makeQuestion({ lessonId, lessonTitle, i }) {
  return {
    code: `${lessonId.toUpperCase()}-${pad(i, 3)}`, // unique per lesson
    type: "mcq",
    content: `[${lessonTitle || lessonId}] Question ${i}`,
    choices: makeChoices(),
    answer: { correct: Math.floor(Math.random() * 4) }, // 0..3
    explanation: "Auto-generated seed question",
    structureNodeId: lessonId,
    difficulty: "easy",
    tags: [lessonTitle || lessonId],
  };
}

(async () => {
  await mongoose.connect(MONGO_URI);

  const bank = await QuestionBank.findById(bankId).lean();
  if (!bank) {
    console.error("❌ Bank not found:", bankId);
    process.exit(1);
  }

  const lessons = (bank.structureNodes || []).filter((n) => n?.type === "lesson" && n?.id);
  if (!lessons.length) {
    console.error("❌ Bank has no lesson nodes. Apply structure first.");
    process.exit(1);
  }

  const items = [];
  for (const l of lessons) {
    for (let i = 1; i <= perLesson; i++) {
      items.push(makeQuestion({ lessonId: l.id, lessonTitle: l.title, i }));
    }
  }

  // Ensure dir exists
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  // IMPORTANT: write valid JSON array
  fs.writeFileSync(outFile, JSON.stringify(items, null, 2), "utf8");

  console.log(`✅ Generated ${items.length} questions`);
  console.log(`✅ Output: ${outFile}`);

  await mongoose.disconnect();
})();
