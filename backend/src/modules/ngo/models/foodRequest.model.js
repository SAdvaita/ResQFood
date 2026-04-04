import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: foodrequests
 * Relationship: Reference → Ngo (N-1), Reference → Food (1-1, fulfillment link)
 * Purpose: Demand-driven food request posted by NGOs
 */
const foodRequestSchema = new Schema(
  {
    ngoId: {
      type:     Schema.Types.ObjectId,
      ref:      "Ngo",
      required: true
    },

    foodType:    { type: String, required: true },
    quantityKg:  { type: Number, required: true },
    description: { type: String, default: "" },

    status: {
      type:    String,
      enum:    ["open", "partially_fulfilled", "fulfilled", "cancelled", "expired"],
      default: "open"
    },

    expiresAt: { type: Date, required: true },

    /** Reference: Food document that fulfilled this request (nullable) */
    fulfilledByFoodId: {
      type:    Schema.Types.ObjectId,
      ref:     "Food",
      default: null
    }
  },
  {
    timestamps: true,
    collection: "foodrequests"
  }
);

foodRequestSchema.index({ ngoId: 1, status: 1 });
foodRequestSchema.index({ expiresAt: 1, status: 1 });   // expiry cron

const FoodRequest = model("FoodRequest", foodRequestSchema);
export default FoodRequest;
