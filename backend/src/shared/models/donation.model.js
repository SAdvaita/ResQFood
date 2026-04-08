import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ─── Donation Schema ──────────────────────────────────────────────────────────

const donationSchema = new Schema(
  {
    // ── Who donated ────────────────────────────────────
    donorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    donorSnapshot: {
      name:    { type: String },
      phone:   { type: String },
      address: { type: String },
    },

    // ── Food details ───────────────────────────────────
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    foodType: {
      type: String,
      enum: ["cooked", "raw", "packaged", "bakery", "beverages", "other"],
      required: true,
    },
    quantity:     { type: String, required: true }, // e.g. "50 meals", "10 kg"
    servings:     { type: Number, default: null },  // approximate servings
    imageUrl:     { type: String, default: null },   // Cloudinary URL
    imagePublicId:{ type: String, default: null },

    // ── Status machine ─────────────────────────────────
    //   created → claimed → assigned → picked_up → delivered / expired / cancelled
    status: {
      type:    String,
      enum:    ["created","claimed","assigned","picked_up","delivered","expired","cancelled"],
      default: "created",
      index:   true,
    },

    // ── Time constraints ───────────────────────────────
    expiresAt:   { type: Date, required: true }, // when the food expires
    claimBefore: { type: Date, required: true }, // deadline for NGO to claim

    // ── Pickup location (GeoJSON) ─────────────────────
    location: {
      type:        { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String },

    // ── NGO assignment ─────────────────────────────────
    claimedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedAt: { type: Date, default: null },

    // ── Volunteer / Delivery assignment ───────────────
    deliveryId: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
      default: null,
    },

    // ── Tags / allergens ──────────────────────────────
    tags:      [String],
    allergens: [String],

    // ── Notes ─────────────────────────────────────────
    notes: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "donations",
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

donationSchema.index({ location: "2dsphere" });
donationSchema.index({ status: 1, claimBefore: 1 });
donationSchema.index({ donorId: 1, status: 1 });
donationSchema.index({ claimedById: 1 });

// ─── Statics ─────────────────────────────────────────────────────────────────

/** Get all open (claimable) donations near a point */
donationSchema.statics.findNearby = function (lng, lat, maxMetres = 20000) {
  return this.find({
    status: "created",
    claimBefore: { $gt: new Date() },
    location: {
      $near: {
        $geometry:    { type: "Point", coordinates: [lng, lat] },
        $maxDistance: maxMetres,
      },
    },
  });
};

const Donation = model("Donation", donationSchema);

export default Donation;
