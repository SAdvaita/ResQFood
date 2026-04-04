import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: volunteers
 * Relationship: 1-1 Reference → User (role-extension for volunteers)
 * Embedded: badges, certificates (bounded, always fetched together)
 * Purpose: Volunteer-specific logistics and gamification data
 */

const badgeSchema = new Schema(
  {
    name:       { type: String, required: true },
    awardedAt:  { type: Date,   default: Date.now },
    description:{ type: String, default: "" }
  },
  { _id: false }
);

const certificateSchema = new Schema(
  {
    month:       { type: String, required: true },   // "2025-03"
    fileUrl:     { type: String, default: null },
    generatedAt: { type: Date,   default: Date.now }
  },
  { _id: false }
);

const volunteerSchema = new Schema(
  {
    /** Reference: links to User with role="volunteer" */
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true
    },

    vehicleType:   { type: String, enum: ["bike", "car", "walking", "other"], default: "bike" },
    serviceRadius: { type: Number, default: 5 },   // km
    isAvailable:   { type: Boolean, default: false },

    /** Reference: currently active assignment (null when free) */
    activeTaskId: {
      type:    Schema.Types.ObjectId,
      ref:     "Assignment",
      default: null
    },

    // ── Gamification ──────────────────────────────
    tier: {
      type:    String,
      enum:    ["bronze", "silver", "gold"],
      default: "bronze"
    },
    totalPoints:        { type: Number, default: 0 },
    totalDeliveries:    { type: Number, default: 0 },
    averageRating:      { type: Number, default: 0 },
    totalRatings:       { type: Number, default: 0 },
    currentStreak:      { type: Number, default: 0 },
    longestStreak:      { type: Number, default: 0 },
    lastDeliveryDate:   { type: Date,   default: null },

    /** Embedded: badges (bounded, max ~20) */
    badges: { type: [badgeSchema], default: [] },

    /** Embedded: certificates (monthly, bounded ~24) */
    certificates: { type: [certificateSchema], default: [] },

    documentUrl: { type: String, default: null }   // Government ID
  },
  {
    timestamps: true,
    collection: "volunteers"
  }
);

// Statics
volunteerSchema.statics.findAvailableNearby = function (coordinates, radiusKm = 3) {
  return this.find({
    isAvailable:  true,
    activeTaskId: null,
    averageRating: { $gte: 3.5 }
  }).populate("userId", "name phone location");
};

volunteerSchema.index({ userId: 1 });
volunteerSchema.index({ isAvailable: 1, activeTaskId: 1 });
volunteerSchema.index({ tier: 1, totalPoints: -1 });   // leaderboard

const Volunteer = model("Volunteer", volunteerSchema);
export default Volunteer;
