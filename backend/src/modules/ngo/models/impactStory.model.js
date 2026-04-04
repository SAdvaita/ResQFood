import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: impactstories
 * Relationships:
 *   - Reference → Ngo (story owner)
 *   - Reference → Food (linked donation)
 *   - Reference → User as Customer (donor recognition)
 * Purpose: Post-delivery emotional engagement + moderation workflow
 */
const impactStorySchema = new Schema(
  {
    ngoId: {
      type:     Schema.Types.ObjectId,
      ref:      "Ngo",
      required: true
    },
    foodId: {
      type:     Schema.Types.ObjectId,
      ref:      "Food",
      required: true
    },
    customerId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true
    },

    title:            { type: String, required: true },
    story:            { type: String, required: true },
    imageUrl:         { type: String, default: null },
    beneficiaryCount: { type: Number, default: 0 },

    status: {
      type:    String,
      enum:    ["pending", "approved", "rejected"],
      default: "pending"
    },

    isPublic:   { type: Boolean, default: false },
    approvedAt: { type: Date,    default: null },
    approvedBy: {
      type:    Schema.Types.ObjectId,
      ref:     "User",
      default: null
    }
  },
  {
    timestamps: true,
    collection: "impactstories"
  }
);

impactStorySchema.index({ ngoId: 1, status: 1 });
impactStorySchema.index({ status: 1, isPublic: 1 });   // public map query

const ImpactStory = model("ImpactStory", impactStorySchema);
export default ImpactStory;
