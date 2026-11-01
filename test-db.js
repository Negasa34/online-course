require("dotenv").config();

const mongoose = require("mongoose");

async function testConnection() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "olinecourse",
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Connected Successfully!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("MongoDB Connection Failed:");
    console.error(error.name);
    console.error(error.message);

    process.exit(1);
  }
}

testConnection();