import mongoose from "mongoose";
import Food from "../../customer/models/food.model.js";
import Ngo from "../models/ngo.model.js";
import FoodRequest from "../models/foodRequest.model.js";
import ImpactStory from "../models/impactStory.model.js";
import { AppError } from "../../../utils/appError.util.js";

const getUser = () => mongoose.model("User");

// ─── Ensure NGO Profile ──────────────────────────────────────────────────────

export const ensureNgoProfile = async (userId) => {
  let ngo = await Ngo.findOne({ userId });
  if (!ngo) {
    const user = await getUser().findById(userId).lean();
    ngo = await Ngo.create({
      userId,
      organisationName: user?.name || "My Organisation",
      registrationNo: "PENDING",
      address: user?.address || null,
    });
  }
  return ngo;
};

// ─── Browse Available Food ────────────────────────────────────────────────────

export const getAvailableFood = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  const filter = { status: "available", expiresAt: { $gt: new Date() } };
  if (query.category) filter.category = query.category;

  const [foods, total] = await Promise.all([
    Food.find(filter)
      .sort({ urgencyScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("customerId", "name phone address")
      .lean(),
    Food.countDocuments(filter),
  ]);

  return { foods, total, page, pages: Math.ceil(total / limit) };
};

// ─── Claim Food ───────────────────────────────────────────────────────────────

export const claimFood = async (ngoUserId, foodId) => {
  const ngo = await ensureNgoProfile(ngoUserId);
  const food = await Food.findById(foodId);
  if (!food) throw new AppError("Food not found", 404, "NOT_FOUND");
  if (food.status !== "available") throw new AppError("Food is no longer available", 400, "BAD_REQUEST");
  if (new Date(food.expiresAt) < new Date()) throw new AppError("Food has expired", 400, "BAD_REQUEST");

  food.status = "accepted";
  food.acceptedByNgoId = ngo._id;
  await food.save();
  return food;
};

// ─── Get My Claims ────────────────────────────────────────────────────────────

export const getMyClaims = async (ngoUserId, query = {}) => {
  const ngo = await ensureNgoProfile(ngoUserId);
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  const filter = { acceptedByNgoId: ngo._id };
  if (query.status) filter.status = query.status;

  const [foods, total] = await Promise.all([
    Food.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("customerId", "name phone address").lean(),
    Food.countDocuments(filter),
  ]);

  return { foods, total, page, pages: Math.ceil(total / limit) };
};

// ─── NGO Stats ────────────────────────────────────────────────────────────────

export const getNgoStats = async (ngoUserId) => {
  const ngo = await ensureNgoProfile(ngoUserId);
  const [claimed, delivered, inDelivery, availableNearby] = await Promise.all([
    Food.countDocuments({ acceptedByNgoId: ngo._id }),
    Food.countDocuments({ acceptedByNgoId: ngo._id, status: "delivered" }),
    Food.countDocuments({ acceptedByNgoId: ngo._id, status: { $in: ["assigned", "picked_up", "in_transit"] } }),
    Food.countDocuments({ status: "available", expiresAt: { $gt: new Date() } }),
  ]);
  return { claimed, delivered, inDelivery, availableNearby };
};

// ─── Food Requests ────────────────────────────────────────────────────────────

export const createFoodRequest = async (ngoUserId, payload) => {
  const ngo = await ensureNgoProfile(ngoUserId);
  const { foodType, quantityKg, description, expiresAt } = payload;
  if (!foodType || !quantityKg || !expiresAt) {
    throw new AppError("foodType, quantityKg, and expiresAt are required", 400, "VALIDATION_ERROR");
  }
  return FoodRequest.create({
    ngoId: ngo._id,
    foodType,
    quantityKg,
    description: description || "",
    expiresAt: new Date(expiresAt),
  });
};

export const getMyFoodRequests = async (ngoUserId, query = {}) => {
  const ngo = await ensureNgoProfile(ngoUserId);
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);

  const [requests, total] = await Promise.all([
    FoodRequest.find({ ngoId: ngo._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    FoodRequest.countDocuments({ ngoId: ngo._id }),
  ]);
  return { requests, total, page, pages: Math.ceil(total / limit) };
};

// ─── Impact Stories ───────────────────────────────────────────────────────────

export const createImpactStory = async (ngoUserId, payload) => {
  const ngo = await ensureNgoProfile(ngoUserId);
  const { foodId, customerId, title, story, imageUrl, beneficiaryCount } = payload;
  if (!foodId || !customerId || !title || !story) {
    throw new AppError("foodId, customerId, title, and story are required", 400, "VALIDATION_ERROR");
  }
  return ImpactStory.create({
    ngoId: ngo._id,
    foodId,
    customerId,
    title,
    story,
    imageUrl: imageUrl || null,
    beneficiaryCount: beneficiaryCount || 0,
  });
};

export const getImpactStories = async (ngoUserId, query = {}) => {
  const ngo = await ensureNgoProfile(ngoUserId);
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);

  const [stories, total] = await Promise.all([
    ImpactStory.find({ ngoId: ngo._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("foodId", "foodName category").populate("customerId", "name").lean(),
    ImpactStory.countDocuments({ ngoId: ngo._id }),
  ]);
  return { stories, total, page, pages: Math.ceil(total / limit) };
};

// ─── NGO Profile ──────────────────────────────────────────────────────────────

export const getNgoProfile = async (userId) => {
  return ensureNgoProfile(userId);
};

export const updateNgoProfile = async (userId, payload) => {
  const ngo = await ensureNgoProfile(userId);
  const allowed = ["organisationName", "registrationNo", "documentUrl", "address", "maxDailyCapacityKg", "maxAcceptancesPerHour"];
  for (const key of allowed) {
    if (payload[key] !== undefined) ngo[key] = payload[key];
  }
  if (payload.coordinates && Array.isArray(payload.coordinates) && payload.coordinates.length === 2) {
    ngo.location = { type: "Point", coordinates: payload.coordinates };
  }
  await ngo.save();
  return ngo;
};
