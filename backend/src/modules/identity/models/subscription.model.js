import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: subscriptions
 * Relationship: 1-1 Reference → User (customer)
 * Purpose: Customer billing lifecycle (free / premium)
 */
const subscriptionSchema = new Schema(
  {
    /** Reference to customer User */
    customerId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true
    },

    plan: {
      type:    String,
      enum:    ["free", "premium"],
      default: "free"
    },

    status: {
      type:    String,
      enum:    ["active", "cancelled", "expired", "trial"],
      default: "active"
    },

    /** Amount in paise (₹499 = 49900) */
    amountPaise:    { type: Number, default: 0 },
    currency:       { type: String, default: "INR" },

    /** Razorpay subscription id for recurring billing */
    razorpaySubId:  { type: String, default: null },

    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd:   { type: Date, default: null },

    /** Monthly post usage (reset each billing period) */
    postsUsedThisPeriod: { type: Number, default: 0 },
    postLimit:           { type: Number, default: 10 }       // 10 for free, Infinity for premium
  },
  {
    timestamps: true,
    collection: "subscriptions"
  }
);

// Indexing
subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ status: 1, plan: 1 });

const Subscription = model("Subscription", subscriptionSchema);
export default Subscription;
