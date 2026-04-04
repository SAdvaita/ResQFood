import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: auditlogs
 * Relationships:
 *   - Reference → User (actor)
 *   - Reference → any entity (polymorphic)
 * Purpose: Immutable append-only security/compliance audit trail
 * Design: No updates ever — only inserts. Indexed by timestamp.
 */
const auditLogSchema = new Schema(
  {
    /** Reference: who performed the action */
    actorId: {
      type:    Schema.Types.ObjectId,
      ref:     "User",
      default: null   // null for system actions
    },
    actorRole: { type: String, default: "system" },

    action: {
      type: String,
      enum: [
        "user_registered",
        "user_approved",
        "user_rejected",
        "user_suspended",
        "login_success",
        "login_failed",
        "login_locked",
        "logout",
        "food_posted",
        "food_accepted",
        "food_cancelled",
        "food_expired",
        "assignment_created",
        "pickup_verified",
        "delivery_verified",
        "qr_fraud_attempt",
        "subscription_upgraded",
        "subscription_cancelled",
        "impact_story_approved",
        "reward_redeemed"
      ],
      required: true
    },

    /** Polymorphic reference to the affected entity */
    entityId:   { type: Schema.Types.ObjectId, default: null },
    entityType: { type: String, default: null },   // "User", "Food", "Assignment", etc.

    description: { type: String, default: "" },

    metadata: {
      type:    Schema.Types.Mixed,
      default: {}
    },

    ipAddress: { type: String, default: null }
  },
  {
    timestamps: true,
    collection: "auditlogs",
    // Prevent accidental updates — enforce append-only from application layer
  }
);

// Security-compliant indexing
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityId: 1, entityType: 1 });
auditLogSchema.index({ createdAt: -1 });                // time-range admin queries

const AuditLog = model("AuditLog", auditLogSchema);
export default AuditLog;
