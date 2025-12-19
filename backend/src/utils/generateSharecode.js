// src/utils/generateShareCode.js
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomCode(len = 7) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/**
 * Sinh shareCode unique bằng cách check DB.
 * @param {import("mongoose").Model} HomeworkModel
 */
export async function generateUniqueShareCode(HomeworkModel, len = 7) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomCode(len + Math.floor(attempt / 4)); // tăng dần độ dài nếu trùng
    const exists = await HomeworkModel.exists({ shareCode: code });
    if (!exists) return code;
  }
  throw new Error("Cannot generate unique shareCode");
}
module.exports = { generateUniqueShareCode };