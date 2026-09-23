const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");

  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10, minPoolSize: 0 });
}

module.exports = connectDB;
