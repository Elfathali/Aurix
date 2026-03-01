const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 4000;

console.log("MONGO_URI:", process.env.MONGO_URI);

async function start() {
  try {
    // ✅ make sure this is EXACTLY MONGO_URI
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    process.exit(1);
  }
}
start();