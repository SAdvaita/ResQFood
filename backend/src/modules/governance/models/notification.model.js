import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: notifications
 * Relationship: Reference → User (recipient)
 * Purpose: In-app alert system; push/SMS/email channels tracked separately
 */
const notificationSchema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true
    },

    type: {
      type: String,
      enum: [
        "food_posted",
        "food_accepted",
        "volunteer_assigned",
        "pickup_complete",
        "delivery_complete",
        "account_approved",
        "account_rejected",
        "impact_story_approved",
        "subscription_update",
        "general"
      ],
      required: true
    },

    title:   { type: String, required: true },
    body:    { type: String, required: true },
    isRead:  { type: Boolean, default: false },
    readAt:  { type: Date,   default: null },

    /** Optional reference to the entity that triggered the notification */
    relatedEntityId:   { type: Schema.Types.ObjectId, default: null },
    relatedEntityType: { type: String, default: null }   // "Food", "Assignment", etc.
  },
  {
    timestamps: true,
    collection: "notifications"
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = model("Notification", notificationSchema);
export default Notification;
