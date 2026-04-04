import mongoose from "mongoose";

const { Schema, model } = mongoose;

const timelineSchema = new Schema(
  {
    assignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null }
  },
  { _id: false }
);

const rewardSnapshotSchema = new Schema(
  {
    basePoints: { type: Number, default: 50 },
    multiplier: { type: Number, default: 1 },
    finalPoints: { type: Number, default: 50 }
  },
  { _id: false }
);

const assignmentSchema = new Schema(
  {
    foodId: { type: Schema.Types.ObjectId, ref: "Food", required: true, index: true },
    volunteerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ngoUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["assigned", "navigating_pickup", "picked_up", "navigating_ngo", "delivered", "cancelled"],
      default: "assigned"
    },
    timeline: { type: timelineSchema, default: () => ({}) },
    rewardSnapshot: { type: rewardSnapshotSchema, default: () => ({}) }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

assignmentSchema.index({ volunteerUserId: 1, status: 1 });

assignmentSchema.statics.findDetailedById = function (assignmentId) {
  return this.findById(assignmentId)
    .populate("foodId")
    .populate("volunteerUserId", "name role")
    .populate("customerUserId", "name role")
    .populate("ngoUserId", "name role");
};

const Assignment = model("Assignment", assignmentSchema);

export default Assignment;
