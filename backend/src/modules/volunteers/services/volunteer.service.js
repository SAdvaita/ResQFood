import mongoose from "mongoose";
import Food from "../../customer/models/food.model.js";
import VolunteerModel from "../models/volunteer.model.js";
import Assignment from "../models/Assignment.model.js";
import Reward from "../models/reward.model.js";
import RewardRedemption from "../models/rewardRedemption.model.js";
import { AppError } from "../../../utils/appError.util.js";

const getUser = () => mongoose.model("User");

// ─── Ensure Volunteer Profile ─────────────────────────────────────────────────

export const ensureVolunteerProfile = async (userId) => {
  let vol = await VolunteerModel.findOne({ userId });
  if (!vol) {
    vol = await VolunteerModel.create({ userId });
  }
  return vol;
};

// ─── Get Available Assignments (claimed food not yet assigned) ─────────────────

export const getAvailableAssignments = async (userId, query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);

  // Foods that have been accepted by an NGO but not yet assigned to a volunteer
  const filter = { status: "accepted", expiresAt: { $gt: new Date() } };

  const [foods, total] = await Promise.all([
    Food.find(filter)
      .sort({ urgencyScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("customerId", "name phone address")
      .populate("acceptedByNgoId", "organisationName address")
      .lean(),
    Food.countDocuments(filter),
  ]);

  return { foods, total, page, pages: Math.ceil(total / limit) };
};

// ─── Accept Assignment ────────────────────────────────────────────────────────

export const acceptAssignment = async (userId, foodId) => {
  const vol = await ensureVolunteerProfile(userId);

  if (vol.activeTaskId) {
    throw new AppError("You already have an active delivery. Complete it first.", 400, "BAD_REQUEST");
  }

  const food = await Food.findById(foodId);
  if (!food) throw new AppError("Food not found", 404, "NOT_FOUND");
  if (food.status !== "accepted") throw new AppError("Food is not available for pickup", 400, "BAD_REQUEST");

  // Create assignment
  const assignment = await Assignment.create({
    foodId: food._id,
    volunteerId: vol._id,
    customerId: food.customerId,
    ngoId: food.acceptedByNgoId,
    status: "assigned",
    timeline: { assignedAt: new Date() },
  });

  // Update food status
  food.status = "assigned";
  await food.save();

  // Mark volunteer as busy
  vol.activeTaskId = assignment._id;
  vol.isAvailable = false;
  await vol.save();

  return assignment;
};

// ─── Update Assignment Status ─────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  assigned: ["navigating_pickup", "cancelled"],
  navigating_pickup: ["at_pickup", "cancelled"],
  at_pickup: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["delivered", "cancelled"],
};

export const updateAssignmentStatus = async (userId, assignmentId, newStatus) => {
  const vol = await ensureVolunteerProfile(userId);
  const assignment = await Assignment.findOne({ _id: assignmentId, volunteerId: vol._id });
  if (!assignment) throw new AppError("Assignment not found", 404, "NOT_FOUND");

  const allowed = VALID_TRANSITIONS[assignment.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`Cannot transition from '${assignment.status}' to '${newStatus}'`, 400, "BAD_REQUEST");
  }

  assignment.status = newStatus;

  // Update timeline
  if (newStatus === "picked_up") assignment.timeline.pickedUpAt = new Date();
  if (newStatus === "in_transit") assignment.timeline.inTransitAt = new Date();
  if (newStatus === "delivered") assignment.timeline.deliveredAt = new Date();
  if (newStatus === "cancelled") assignment.timeline.cancelledAt = new Date();

  await assignment.save();

  // Update Food status to match
  const food = await Food.findById(assignment.foodId);
  if (food) {
    if (newStatus === "picked_up") food.status = "picked_up";
    else if (newStatus === "in_transit") food.status = "in_transit";
    else if (newStatus === "delivered") food.status = "delivered";
    else if (newStatus === "cancelled") food.status = "accepted"; // revert for re-assignment
    await food.save();
  }

  // If completed or cancelled, free the volunteer
  if (["delivered", "cancelled"].includes(newStatus)) {
    vol.activeTaskId = null;
    vol.isAvailable = true;
    if (newStatus === "delivered") {
      vol.totalDeliveries += 1;
      vol.totalPoints += (assignment.rewardSnapshot?.totalPoints || 50);
      vol.lastDeliveryDate = new Date();
      vol.currentStreak += 1;
      if (vol.currentStreak > vol.longestStreak) vol.longestStreak = vol.currentStreak;
      // Tier promotion
      if (vol.totalPoints >= 1000) vol.tier = "gold";
      else if (vol.totalPoints >= 300) vol.tier = "silver";
    }
    await vol.save();
  }

  return assignment;
};

// ─── Get Active Assignment ────────────────────────────────────────────────────

export const getActiveAssignment = async (userId) => {
  const vol = await ensureVolunteerProfile(userId);
  if (!vol.activeTaskId) return null;
  return Assignment.findById(vol.activeTaskId)
    .populate("foodId")
    .populate("customerId", "name phone address")
    .populate("ngoId", "organisationName address")
    .lean();
};

// ─── Assignment History ───────────────────────────────────────────────────────

export const getAssignmentHistory = async (userId, query = {}) => {
  const vol = await ensureVolunteerProfile(userId);
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);

  const [assignments, total] = await Promise.all([
    Assignment.find({ volunteerId: vol._id, status: { $in: ["delivered", "cancelled"] } })
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("foodId", "foodName category quantity").lean(),
    Assignment.countDocuments({ volunteerId: vol._id, status: { $in: ["delivered", "cancelled"] } }),
  ]);

  return { assignments, total, page, pages: Math.ceil(total / limit) };
};

// ─── Volunteer Stats ──────────────────────────────────────────────────────────

export const getVolunteerStats = async (userId) => {
  const vol = await ensureVolunteerProfile(userId);
  return {
    totalDeliveries: vol.totalDeliveries,
    totalPoints: vol.totalPoints,
    tier: vol.tier,
    averageRating: vol.averageRating,
    currentStreak: vol.currentStreak,
    isAvailable: vol.isAvailable,
    hasActiveTask: !!vol.activeTaskId,
  };
};

// ─── Volunteer Profile ────────────────────────────────────────────────────────

export const getVolunteerProfile = async (userId) => {
  const vol = await ensureVolunteerProfile(userId);
  return VolunteerModel.findById(vol._id).populate("userId", "name email phone").lean();
};

export const updateVolunteerProfile = async (userId, payload) => {
  const vol = await ensureVolunteerProfile(userId);
  const allowed = ["vehicleType", "serviceRadius", "documentUrl"];
  for (const key of allowed) {
    if (payload[key] !== undefined) vol[key] = payload[key];
  }
  await vol.save();
  return vol;
};

// ─── Toggle Availability ──────────────────────────────────────────────────────

export const toggleAvailability = async (userId) => {
  const vol = await ensureVolunteerProfile(userId);
  if (vol.activeTaskId) throw new AppError("Cannot go offline while on a delivery", 400, "BAD_REQUEST");
  vol.isAvailable = !vol.isAvailable;
  await vol.save();
  return { isAvailable: vol.isAvailable };
};

// ─── Rewards ──────────────────────────────────────────────────────────────────

export const getRewards = async () => {
  return Reward.find({ isActive: true }).sort({ pointsCost: 1 }).lean();
};

export const redeemReward = async (userId, rewardId) => {
  const vol = await ensureVolunteerProfile(userId);
  const reward = await Reward.findById(rewardId);
  if (!reward || !reward.isActive) throw new AppError("Reward not found", 404, "NOT_FOUND");
  if (vol.totalPoints < reward.pointsCost) throw new AppError("Insufficient points", 400, "BAD_REQUEST");
  if (reward.stock !== null && reward.stock <= 0) throw new AppError("Reward out of stock", 400, "BAD_REQUEST");

  vol.totalPoints -= reward.pointsCost;
  await vol.save();

  if (reward.stock !== null) {
    reward.stock -= 1;
    await reward.save();
  }

  return RewardRedemption.create({
    volunteerId: vol._id,
    rewardId: reward._id,
    pointsSpent: reward.pointsCost,
    rewardTitleSnapshot: reward.title,
  });
};
