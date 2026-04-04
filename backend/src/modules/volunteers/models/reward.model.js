import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: rewards
 * Purpose: Master catalog of available rewards (independent entity)
 * 1-N → RewardRedemption
 */
const rewardSchema = new Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    type: {
      type:    String,
      enum:    ["voucher", "gift_card", "charity_donation", "certificate"],
      required: true
    },
    pointsCost:  { type: Number, required: true },
    imageUrl:    { type: String, default: null },
    isActive:    { type: Boolean, default: true },
    stock:       { type: Number, default: null }   // null = unlimited
  },
  {
    timestamps: true,
    collection: "rewards"
  }
);

rewardSchema.index({ isActive: 1, pointsCost: 1 });

const Reward = model("Reward", rewardSchema);
export default Reward;
