
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Admin = require("../models/Admin");

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Delete existing admins
        console.log("Deleting old admin accounts...");
        await Admin.deleteMany({});
        console.log("Old admin accounts deleted.");

        // Create new admin
        console.log("Creating new admin account...");
        const newAdmin = new Admin({
            email: "admin@onecare.com",
            password: "admin123", // The pre-save hook in Admin.js will hash this
            name: "System Admin",
            role: "admin",
            profileCompleted: true,
        });

        await newAdmin.save();
        console.log("New admin account created successfully.");
        console.log("Email: admin@onecare.com");
        console.log("Password: admin123");

        process.exit(0);
    } catch (error) {
        console.error("Error resetting admin:", error);
        process.exit(1);
    }
};

resetAdmin();
