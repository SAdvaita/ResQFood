import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: ngos
 * Relationship: 1-1 Reference → User (role-extension profile for NGO users)
 * Purpose: Store NGO-specific organisational data
 */
const ngoSchema = new Schema(
  {
    /** Reference: links to the User document with role="ngo" */
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true
    },

    organisationName: { type: String, required: true, trim: true },
    registrationNo:   { type: String, required: true, trim: true },
    documentUrl:      { type: String, default: null },     // registration certificate

    /** GeoJSON – 2dsphere for geo-matching */
    location: {
      type: {
        type:        { type: String, enum: ["Point"] },
        coordinates: { type: [Number] }
      }
    },
    address: { type: String, default: null },

    /** Operational capacity */
    maxDailyCapacityKg:     { type: Number, default: 100 },
    maxAcceptancesPerHour:  { type: Number, default: 5 },

    /** Aggregate stats (denormalised snapshot for dashboard) */
    totalKgReceived:    { type: Number, default: 0 },
    totalBeneficiaries: { type: Number, default: 0 },
    totalDonationsAccepted: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    collection: "ngos"
  }
);

ngoSchema.index({ userId: 1 });
ngoSchema.index({ location: "2dsphere" });

const Ngo = model("Ngo", ngoSchema);
export default Ngo;
