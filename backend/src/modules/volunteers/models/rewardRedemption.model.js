import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: rewardredemptions
 * Relationships:
 *   - Reference → Volunteer (N-1)
 *   - Reference → Reward (N-1)
 * Purpose: Track volunteer reward redemptions
 */
const rewardRedemptionSchema = new Schema(
  {
    volunteerId: {
      type:     Schema.Types.ObjectId,
      ref:      "Volunteer",
      required: true
    },
    rewardId: {
      type:     Schema.Types.ObjectId,
      ref:      "Reward",
      required: true
    },

    pointsSpent: { type: Number, required: true },

    status: {
      type:    String,
      enum:    ["pending", "fulfilled", "cancelled"],
      default: "pending"
    },

    /** Snapshot of reward title at redemption time (immutable reference) */
    rewardTitleSnapshot: { type: String, required: true },

    redeemedAt:  { type: Date, default: Date.now },
    fulfilledAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    collection: "rewardredemptions"
  }
);

rewardRedemptionSchema.index({ volunteerId: 1, status: 1 });
rewardRedemptionSchema.index({ rewardId: 1 });

const RewardRedemption = model("RewardRedemption", rewardRedemptionSchema);
export default RewardRedemption;
