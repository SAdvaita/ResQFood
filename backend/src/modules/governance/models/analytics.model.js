import mongoose from "mongoose";

const { Schema, model } = mongoose;

const analyticsSchema = new Schema(
  {
    scopeType: { type: String, enum: ["platform", "customer", "ngo", "volunteer", "city"], required: true, index: true },
    scopeRefId: { type: Schema.Types.ObjectId, default: null },
    period: { type: String, required: true, index: true },
    snapshot: {
      totalDonations: { type: Number, default: 0 },
      totalKg: { type: Number, default: 0 },
      totalCo2SavedKg: { type: Number, default: 0 },
      totalBeneficiaries: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

analyticsSchema.index({ scopeType: 1, scopeRefId: 1, period: 1 }, { unique: true });

analyticsSchema.statics.platformMonthlyTrend = function () {
  return this.aggregate([
    { $match: { scopeType: "platform" } },
    { $sort: { period: 1 } }
  ]);
};

const Analytics = model("Analytics", analyticsSchema);

export default Analytics;
