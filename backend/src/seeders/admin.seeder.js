/**
 * Admin Seeder
 * ────────────
 * Creates the first admin user in the database.
 * Run once: node src/seeders/admin.seeder.js
 *
 * Usage:
 *   cd backend
 *   node src/seeders/admin.seeder.js
 *
 * Or with custom credentials:
 *   ADMIN_EMAIL=me@mysite.com ADMIN_PASS=MySecret123 node src/seeders/admin.seeder.js
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt   from "bcryptjs";

// ─── Config ───────────────────────────────────────────────────────────────────
const ADMIN_NAME  = process.env.ADMIN_NAME  || "Super Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@resqfood.com";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+919999999999";
const ADMIN_PASS  = process.env.ADMIN_PASS  || "Admin@1234";

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("\n🌱 ResQFood Admin Seeder\n");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Inline schema (avoids import issues with the Mongoose model)
  const User = mongoose.models.User ?? mongoose.model("User",
    new mongoose.Schema(
      {
        name:           String,
        email:          { type: String, lowercase: true },
        phone:          String,
        passwordHash:   String,
        role:           String,
        approvalStatus: { type: String, default: "approved" },
        isActive:       { type: Boolean, default: true },
        emailVerified:  { type: Boolean, default: true },
        phoneVerified:  { type: Boolean, default: true },
        refreshTokens:  [{ token: String, createdAt: Date }],
        profileSnapshot: { name: String, role: String },
      },
      { timestamps: true, collection: "users" }
    )
  );

  // Check for existing admin
  const existing = await User.findOne({
    $or: [
      { email: ADMIN_EMAIL.toLowerCase() },
      { role: "admin" }
    ]
  });

  if (existing) {
    console.log(`\n⚠️  Admin already exists:`);
    console.log(`   Name  : ${existing.name}`);
    console.log(`   Email : ${existing.email}`);
    console.log(`   Role  : ${existing.role}`);
    console.log(`   Status: ${existing.approvalStatus}`);
    console.log("\nTo create a different admin, change ADMIN_EMAIL env var.\n");
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASS, 12);

  const admin = await User.create({
    name:           ADMIN_NAME,
    email:          ADMIN_EMAIL.toLowerCase(),
    phone:          ADMIN_PHONE,
    passwordHash,
    role:           "admin",
    approvalStatus: "approved",
    isActive:       true,
    emailVerified:  true,
    phoneVerified:  true,
    profileSnapshot: { name: ADMIN_NAME, role: "admin" },
  });

  console.log("\n✅ Admin account created successfully!\n");
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│           ADMIN LOGIN CREDENTIALS           │");
  console.log("├─────────────────────────────────────────────┤");
  console.log(`│  Email    : ${ADMIN_EMAIL.padEnd(32)} │`);
  console.log(`│  Password : ${ADMIN_PASS.padEnd(32)} │`);
  console.log(`│  Role     : admin (auto-approved)           │`);
  console.log("└─────────────────────────────────────────────┘");
  console.log("\n👉 Go to http://localhost:5173, click Sign In, and use these credentials.\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB\n");
}

seed().catch((err) => {
  console.error("❌ Seeder failed:", err.message);
  process.exit(1);
});
