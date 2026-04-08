import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ─── Delivery Schema ──────────────────────────────────────────────────────────

const deliverySchema = new Schema(
  {
    // ── Core references ────────────────────────────────
    donationId: {
      type: Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
      unique: true,
      index: true,
    },
    donorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ngoId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ── Snapshots ──────────────────────────────────────
    donorSnapshot: {
      name:    String,
      phone:   String,
      address: String,
    },
    ngoSnapshot: {
      name:    String,
      phone:   String,
      address: String,
    },
    volunteerSnapshot: {
      name:  String,
      phone: String,
    },

    // ── Status ─────────────────────────────────────────
    // assigned → picked_up → delivered / failed
    status: {
      type: String,
      enum: ["pending", "assigned", "picked_up", "delivered", "failed"],
      default: "pending",
      index: true,
    },

    // ── Locations ──────────────────────────────────────
    pickupLocation: {
      type:        { type: String, enum: ["Point"] },
      coordinates: [Number],
    },
    dropoffLocation: {
      type:        { type: String, enum: ["Point"] },
      coordinates: [Number],
    },
    pickupAddress:  { type: String },
    dropoffAddress: { type: String },

    // ── Timeline ──────────────────────────────────────
    assignedAt:  { type: Date, default: null },
    pickedUpAt:  { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    // ── Notes ─────────────────────────────────────────
    notes:          { type: String, default: null },
    failureReason:  { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "deliveries",
  }
);

deliverySchema.index({ pickupLocation: "2dsphere" });
deliverySchema.index({ status: 1, volunteerId: 1 });

const Delivery = model("Delivery", deliverySchema);

export default Delivery;
