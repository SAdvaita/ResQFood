import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * OTP Schema
 * Stores one-time passwords for phone/email verification.
 * TTL index auto-deletes expired OTPs after expiresAt.
 */
const otpSchema = new Schema(
  {
    // Target (phone or email)
    identifier: {
      type:     String,
      required: true,
      trim:     true,
      lowercase: true,
    },

    // OTP purpose
    purpose: {
      type:    String,
      enum:    ["phone_verify", "email_verify", "password_reset", "login_2fa"],
      required: true,
    },

    // 6-digit hashed code (store hash, compare on verify)
    codeHash: { type: String, required: true },

    // How many times the user has tried to verify (max 5)
    attempts: { type: Number, default: 0 },

    // Whether it has already been used
    used: { type: Boolean, default: false },

    // Auto-expires via TTL index (10 minutes)
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: "otps",
  }
);

// TTL index — MongoDB removes documents when expiresAt passes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast lookup
otpSchema.index({ identifier: 1, purpose: 1 });

const OTP = model("OTP", otpSchema);

export default OTP;
