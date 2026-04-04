import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Collection: analytics
 * Pattern: CQRS-style pre-aggregated read model — separate from transactional data
 * Purpose: Fast CSR reports and dashboard loading without hitting live collections
 * Indexing: scope + period for time-series queries
 */
const analyticsSchema = new Schema(
  {
    /** Scope: platform-wide, city, customer, ngo, volunteer */
    scope: {
      type:     String,
      enum:     ["platform", "city", "customer", "ngo", "volunteer"],
      required: true
    },

    /** Reference: the entity this analytics row belongs to (nullable for platform/city) */
    entityId: {
      type:    Schema.Types.ObjectId,
      default: null
    },

    /** "2025-03" – YYYY-MM for monthly aggregation */
    period: { type: String, required: true },

    // ── Metrics ──────────────────────────────────
    totalDonations:     { type: Number, default: 0 },
    totalKgDonated:     { type: Number, default: 0 },
    totalMealsServed:   { type: Number, default: 0 },
    totalBeneficiaries: { type: Number, default: 0 },
    co2SavedKg:         { type: Number, default: 0 },
    deliverySuccessRate:{ type: Number, default: 0 },   // 0–100 %
    activeUsers:        { type: Number, default: 0 },

    // ── City heatmap ─────────────────────────────
    cityName:  { type: String, default: null },
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  {
    timestamps: true,
    collection: "analytics"
  }
);

// Compound index for time-series dashboard queries
analyticsSchema.index({ scope: 1, entityId: 1, period: -1 });
analyticsSchema.index({ scope: 1, period: -1 });

const Analytics = model("Analytics", analyticsSchema);
export default Analytics;
