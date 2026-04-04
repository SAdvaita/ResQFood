import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: foods
 * Relationships:
 *   - Reference → User (customer owner)
 *   - Reference → Assignment (logistics)
 *   - Reference → DonationDrive (optional campaign)
 * Embedded: qrSnapshot (fast validation without QRTokens join)
 * Patterns: 2dsphere index, compound index, Statics, urgency score
 * Purpose: Surplus food donation unit with full lifecycle
 */

const qrSnapshotSchema = new Schema(
  {
    pickupToken:   { type: String, default: null },
    deliveryToken: { type: String, default: null },
    pickupScanned: { type: Boolean, default: false },
    deliveryScanned: { type: Boolean, default: false }
  },
  { _id: false }
);

/** Snapshot of impact – denormalised at delivery time for CSR accuracy */
const impactSnapshotSchema = new Schema(
  {
    kgDelivered:              { type: Number, default: 0 },
    estimatedMeals:           { type: Number, default: 0 },
    co2SavedKg:               { type: Number, default: 0 },
    beneficiaryCount:         { type: Number, default: 0 },
    deliveredAt:              { type: Date,   default: null }
  },
  { _id: false }
);

const foodSchema = new Schema(
  {
    /** Reference: customer owner */
    customerId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true
    },

    // ── Food details ──────────────────────────────
    foodName:    { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["rice", "meat", "vegetables", "dairy", "bread", "snacks", "beverage", "other"],
      required: true
    },
    quantity:    { type: Number, required: true },
    unit:        { type: String, enum: ["kg", "litres", "portions", "boxes"], default: "kg" },
    description: { type: String, default: "" },
    imageUrl:    { type: String, default: null },

    // ── Timing ────────────────────────────────────
    preparedAt:  { type: Date, required: true },
    expiresAt:   { type: Date, required: true },

    // ── Location ──────────────────────────────────
    pickupLocation: {
      type: {
        type:        { type: String, enum: ["Point"] },
        coordinates: { type: [Number], required: true }
      }
    },
    pickupAddress: { type: String, required: true },

    // ── Lifecycle ─────────────────────────────────
    status: {
      type: String,
      enum: ["available", "accepted", "assigned", "picked_up", "in_transit", "delivered", "expired", "cancelled"],
      default: "available"
    },
    urgencyScore:  { type: Number, default: 0, min: 0, max: 100 },
    urgencyLevel: {
      type:    String,
      enum:    ["low", "medium", "high", "critical"],
      default: "low"
    },

    /** Reference: NGO that accepted this donation */
    acceptedByNgoId: {
      type:    Schema.Types.ObjectId,
      ref:     "Ngo",
      default: null
    },

    /** Reference: donation drive (optional) */
    donationDriveId: {
      type:    Schema.Types.ObjectId,
      ref:     "DonationDrive",
      default: null
    },

    /** Embedded: QR token snapshot for quick validation */
    qrSnapshot: qrSnapshotSchema,

    /** Embedded Snapshot: locked at delivery time for CSR reporting */
    impactSnapshot: impactSnapshotSchema
  },
  {
    timestamps: true,
    collection: "foods"
  }
);

// ── Statics ──────────────────────────────────────────────────────────────────

/** Find available food within radiusKm of [lng, lat] sorted by urgency */
foodSchema.statics.findNearbyAvailable = function (coordinates, radiusKm = 5) {
  return this.find({
    status: "available",
    expiresAt: { $gt: new Date() },
    pickupLocation: {
      $nearSphere: {
        $geometry:    { type: "Point", coordinates },
        $maxDistance: radiusKm * 1000
      }
    }
  }).sort({ urgencyScore: -1 });
};

// ── Indexing ─────────────────────────────────────────────────────────────────

foodSchema.index({ pickupLocation: "2dsphere" });
foodSchema.index({ status: 1, urgencyScore: -1 });        // NGO discovery sort
foodSchema.index({ expiresAt: 1, status: 1 });            // expiry cron
foodSchema.index({ customerId: 1, createdAt: -1 });       // customer history
foodSchema.index({ "qrSnapshot.pickupToken": 1 });        // QR lookup

const Food = model("Food", foodSchema);
export default Food;
