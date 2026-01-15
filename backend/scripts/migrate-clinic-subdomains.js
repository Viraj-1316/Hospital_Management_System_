/**
 * Migration Script: Ensure all clinics have subdomains
 * This script will:
 * 1. Find all clinics without a subdomain
 * 2. Generate a subdomain from the clinic name
 * 3. Update the clinic record
 * 
 * Run with: node scripts/migrate-clinic-subdomains.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Generate subdomain from clinic name
function generateSubdomain(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with dashes
    .replace(/-+/g, '-')          // Remove multiple dashes
    .replace(/^-|-$/g, '')        // Remove leading/trailing dashes
    .substring(0, 30);            // Limit length
}

// Ensure subdomain is unique
async function getUniqueSubdomain(Clinic, baseSubdomain) {
  let subdomain = baseSubdomain;
  let counter = 1;
  
  while (await Clinic.findOne({ subdomain })) {
    subdomain = `${baseSubdomain}-${counter}`;
    counter++;
  }
  
  return subdomain;
}

async function migrate() {
  await connectDB();
  
  const Clinic = require('../models/Clinic');
  
  console.log('\n🔍 Finding clinics without subdomains...\n');
  
  // Find clinics without subdomain or with empty subdomain
  const clinicsWithoutSubdomain = await Clinic.find({
    $or: [
      { subdomain: { $exists: false } },
      { subdomain: null },
      { subdomain: '' }
    ]
  });
  
  if (clinicsWithoutSubdomain.length === 0) {
    console.log('✅ All clinics already have subdomains!');
    process.exit(0);
  }
  
  console.log(`📋 Found ${clinicsWithoutSubdomain.length} clinics without subdomains:\n`);
  
  for (const clinic of clinicsWithoutSubdomain) {
    const baseSubdomain = generateSubdomain(clinic.name);
    const subdomain = await getUniqueSubdomain(Clinic, baseSubdomain);
    
    console.log(`  - ${clinic.name}`);
    console.log(`    → Subdomain: ${subdomain}`);
    
    // Update the clinic
    await Clinic.updateOne(
      { _id: clinic._id },
      { $set: { subdomain: subdomain } }
    );
  }
  
  console.log('\n✅ Migration complete! All clinics now have subdomains.');
  console.log('\n📝 Clinics can now be accessed at:');
  console.log('   Login: /c/{subdomain}/login');
  console.log('   Signup: /c/{subdomain}/signup');
  
  // List all clinics with their subdomains
  console.log('\n📋 All clinic subdomains:\n');
  const allClinics = await Clinic.find({}, { name: 1, subdomain: 1, hospitalId: 1 }).sort({ name: 1 });
  
  for (const clinic of allClinics) {
    console.log(`  ${clinic.name}`);
    console.log(`    Subdomain: ${clinic.subdomain || '(none)'}`);
    console.log(`    Hospital ID: ${clinic.hospitalId || '(none)'}`);
    console.log('');
  }
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
