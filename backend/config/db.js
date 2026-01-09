const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Optimized connection options for Render free tier
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // Limit connection pool size
      minPoolSize: 2,  // Keep minimum connections ready
      serverSelectionTimeoutMS: 5000, // Faster timeout for server selection
      socketTimeoutMS: 45000, // Prevent hanging connections
      family: 4, // Use IPv4, Render works better with this
    });
    console.log("✅ Connected to MongoDB (hospital_auth)");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
