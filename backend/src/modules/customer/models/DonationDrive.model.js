import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: donationdrives
 * Relationship: Reference → User (admin creator)
 * Embedded: leaderboard entries (bounded list, drives are time-limited)
 * Purpose: Admin-curated campaigns with prizes and leaderboards
 */

const leaderboardEntrySchema = new Schema(
  {
    volunteerId: { type: Schema.Types.ObjectId, ref: "Volunteer" },
    name:        { type: String },
    deliveries:  { type: Number, default: 0 },
    points:      { type: Number, default: 0 }
  },
  { _id: false }
);

const donationDriveSchema = new Schema(
  {
    createdBy:   {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true
    },

    title:       { type: String, required: true },
    description: { type: String, default: "" },
    bannerUrl:   { type: String, default: null },

    startsAt:    { type: Date, required: true },
    endsAt:      { type: Date, required: true },

    status: {
      type:    String,
      enum:    ["upcoming", "active", "ended"],
      default: "upcoming"
    },

    targetKg:         { type: Number, default: 0 },
    achievedKg:       { type: Number, default: 0 },
    totalDeliveries:  { type: Number, default: 0 },

    prizeDescription: { type: String, default: null },

    /** Embedded: top-10 leaderboard (bounded, updated by cron) */
    leaderboard: { type: [leaderboardEntrySchema], default: [] }
  },
  {
    timestamps: true,
    collection: "donationdrives"
  }
);

donationDriveSchema.index({ status: 1, startsAt: 1, endsAt: 1 });

const DonationDrive = model("DonationDrive", donationDriveSchema);
export default DonationDrive;
