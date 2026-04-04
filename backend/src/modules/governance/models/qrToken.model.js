import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: qrtokens
 * Relationship: Reference → Food
 * Purpose: Fraud prevention — tracks QR scan attempts with TTL auto-expiry
 * Patterns: TTL index (24h auto-delete), one-time-use enforcement, IP/GPS logging
 */
const scanAttemptSchema = new Schema(
  {
    scannedAt:   { type: Date, default: Date.now },
    scannedBy:   { type: Schema.Types.ObjectId, ref: "User" },
    ipAddress:   { type: String, default: null },
    gpsLocation: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: null }
    },
    isValid:     { type: Boolean, default: false },
    reason:      { type: String, default: null }   // "gps_mismatch", "already_used", etc.
  },
  { _id: false }
);

const qrTokenSchema = new Schema(
  {
    foodId: {
      type:     Schema.Types.ObjectId,
      ref:      "Food",
      required: true
    },

    tokenType: {
      type:    String,
      enum:    ["pickup", "delivery"],
      required: true
    },

    token:   { type: String, required: true, unique: true },
    isUsed:  { type: Boolean, default: false },
    usedAt:  { type: Date,   default: null },
    usedBy:  { type: Schema.Types.ObjectId, ref: "User", default: null },

    /** TTL: auto-delete after 24 hours */
    expiresAt: { type: Date, required: true },

    /** Embedded: scan attempt log for fraud analysis */
    scanAttempts: { type: [scanAttemptSchema], default: [] }
  },
  {
    timestamps: true,
    collection: "qrtokens"
  }
);

// TTL index — MongoDB removes document after expiresAt
qrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
qrTokenSchema.index({ token: 1 },    { unique: true });
qrTokenSchema.index({ foodId: 1, tokenType: 1 });

const QRToken = model("QRToken", qrTokenSchema);
export default QRToken;
