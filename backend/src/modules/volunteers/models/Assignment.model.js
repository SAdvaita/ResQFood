import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: assignments
 * Relationships:
 *   - Reference → Food (N-1)
 *   - Reference → Volunteer (N-1)
 *   - Reference → User as Customer (N-1)
 *   - Reference → Ngo (N-1)
 * Purpose: Volunteer delivery lifecycle — fully transactional, heavily updated
 */

const timelineSchema = new Schema(
  {
    assignedAt:   { type: Date, default: null },
    pickedUpAt:   { type: Date, default: null },
    inTransitAt:  { type: Date, default: null },
    deliveredAt:  { type: Date, default: null },
    cancelledAt:  { type: Date, default: null }
  },
  { _id: false }
);

/** Snapshot of reward at completion – locked to prevent future tier-change discrepancies */
const rewardSnapshotSchema = new Schema(
  {
    basePoints:      { type: Number, default: 50 },
    tierMultiplier:  { type: Number, default: 1.0 },
    totalPoints:     { type: Number, default: 50 }
  },
  { _id: false }
);

const assignmentSchema = new Schema(
  {
    foodId: {
      type:     Schema.Types.ObjectId,
      ref:      "Food",
      required: true
    },
    volunteerId: {
      type:     Schema.Types.ObjectId,
      ref:      "Volunteer",
      required: true
    },
    customerId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true
    },
    ngoId: {
      type:     Schema.Types.ObjectId,
      ref:      "Ngo",
      required: true
    },

    status: {
      type: String,
      enum: ["assigned", "navigating_pickup", "at_pickup", "picked_up", "in_transit", "delivered", "cancelled"],
      default: "assigned"
    },

    /** Proof images */
    pickupPhotoUrl:   { type: String, default: null },
    deliveryPhotoUrl: { type: String, default: null },

    /** Ratings */
    customerRating:    { type: Number, min: 1, max: 5, default: null },
    volunteerRating:   { type: Number, min: 1, max: 5, default: null },

    /** Embedded: delivery timeline */
    timeline: timelineSchema,

    /** Embedded Snapshot: points awarded, locked at delivery */
    rewardSnapshot: rewardSnapshotSchema,

    /** Volunteer scoring at assignment time (for audit) */
    assignmentScore: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    collection: "assignments"
  }
);

// Indexing – heavily updated entity needs efficient queries
assignmentSchema.index({ volunteerId: 1, status: 1 });
assignmentSchema.index({ foodId: 1 });
assignmentSchema.index({ ngoId: 1, status: 1 });
assignmentSchema.index({ customerId: 1, createdAt: -1 });

const Assignment = model("Assignment", assignmentSchema);
export default Assignment;
