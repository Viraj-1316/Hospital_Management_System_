// backend/scripts/migrate-patient-uhid.js
// Migration script to backfill UHID for existing patients

const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const Patient = require("../models/Patient");
const Counter = require("../models/Counter");

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function migratePatientUHIDs() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all patients without UHID, ordered by creation date
    const patientsWithoutUHID = await Patient.find({
      $or: [
        { uhid: { $exists: false } },
        { uhid: null },
        { uhid: "" }
      ]
    }).sort({ createdAt: 1 });

    console.log(`📋 Found ${patientsWithoutUHID.length} patients without UHID`);

    if (patientsWithoutUHID.length === 0) {
      console.log("✅ All patients already have UHID. No migration needed.");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const patient of patientsWithoutUHID) {
      try {
        // Generate UHID using Counter model
        const uhid = await Counter.getNextSequence("patient_uhid", "UHID-", null, 5);
        
        // Update patient directly (skip pre-save hook to avoid duplicate generation)
        await Patient.updateOne(
          { _id: patient._id },
          { $set: { uhid: uhid } }
        );

        successCount++;
        console.log(`  ✅ Patient ${patient._id}: Assigned ${uhid}`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Patient ${patient._id}: Error - ${error.message}`);
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${patientsWithoutUHID.length}`);

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run migration
migratePatientUHIDs()
  .then(() => {
    console.log("\n🎉 Migration script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
