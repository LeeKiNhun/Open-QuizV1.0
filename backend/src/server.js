require("dotenv").config();

console.log("PORT =", process.env.PORT);
console.log("MONGO_URI =", process.env.MONGO_URI);

const app = require("./app");
const connectDB = require("./config/db");

(async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`🚀 Backend running: http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Start server failed:", err.message);
    process.exit(1);
  }
})();
