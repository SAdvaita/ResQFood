import Food from "../models/food.model.js";
import { AppError } from "../../../utils/appError.util.js";

// ─── Urgency Helpers ──────────────────────────────────────────────────────────

const computeUrgency = (expiresAt) => {
  const hoursLeft = (new Date(expiresAt) - Date.now()) / 3.6e6;
  if (hoursLeft <= 0) return { score: 0, level: "low" };
  if (hoursLeft <= 1) return { score: 95, level: "critical" };
  if (hoursLeft <= 3) return { score: 70, level: "high" };
  if (hoursLeft <= 12) return { score: 40, level: "medium" };
  return { score: 15, level: "low" };
};

// ─── Create Food Listing ──────────────────────────────────────────────────────

export const createFood = async (customerId, payload) => {
  const {
    foodName, category, quantity, unit, description,
    imageUrl, preparedAt, expiresAt, pickupAddress, coordinates,
  } = payload;

  if (!foodName || !category || !quantity || !preparedAt || !expiresAt || !pickupAddress) {
    throw new AppError("foodName, category, quantity, preparedAt, expiresAt, and pickupAddress are required", 400, "VALIDATION_ERROR");
  }

  const urgency = computeUrgency(expiresAt);

  const foodData = {
    customerId,
    foodName,
    category,
    quantity,
    unit: unit || "kg",
    description: description || "",
    imageUrl: imageUrl || null,
    preparedAt: new Date(preparedAt),
    expiresAt: new Date(expiresAt),
    pickupAddress,
    status: "available",
    urgencyScore: urgency.score,
    urgencyLevel: urgency.level,
  };

  if (Array.isArray(coordinates) && coordinates.length === 2) {
    foodData.pickupLocation = { type: "Point", coordinates };
  }

  return Food.create(foodData);
};

// ─── Get My Foods ─────────────────────────────────────────────────────────────

export const getMyFoods = async (customerId, query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  const filter = { customerId };
  if (query.status) filter.status = query.status;

  const [foods, total] = await Promise.all([
    Food.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Food.countDocuments(filter),
  ]);

  return { foods, total, page, pages: Math.ceil(total / limit) };
};

// ─── Get Food By ID ───────────────────────────────────────────────────────────

export const getFoodById = async (foodId, customerId) => {
  const food = await Food.findOne({ _id: foodId, customerId }).lean();
  if (!food) throw new AppError("Food listing not found", 404, "NOT_FOUND");
  return food;
};

// ─── Update Food ──────────────────────────────────────────────────────────────

export const updateFood = async (foodId, customerId, payload) => {
  const food = await Food.findOne({ _id: foodId, customerId });
  if (!food) throw new AppError("Food listing not found", 404, "NOT_FOUND");
  if (food.status !== "available") {
    throw new AppError("Can only edit food in 'available' status", 400, "BAD_REQUEST");
  }

  const allowed = ["foodName", "category", "quantity", "unit", "description", "imageUrl", "preparedAt", "expiresAt", "pickupAddress"];
  for (const key of allowed) {
    if (payload[key] !== undefined) food[key] = payload[key];
  }

  if (payload.expiresAt) {
    const u = computeUrgency(payload.expiresAt);
    food.urgencyScore = u.score;
    food.urgencyLevel = u.level;
  }

  await food.save();
  return food;
};

// ─── Cancel Food ──────────────────────────────────────────────────────────────

export const cancelFood = async (foodId, customerId) => {
  const food = await Food.findOne({ _id: foodId, customerId });
  if (!food) throw new AppError("Food listing not found", 404, "NOT_FOUND");
  if (["delivered", "cancelled", "expired"].includes(food.status)) {
    throw new AppError(`Cannot cancel food in '${food.status}' status`, 400, "BAD_REQUEST");
  }
  food.status = "cancelled";
  await food.save();
  return food;
};

// ─── Customer Stats ───────────────────────────────────────────────────────────

export const getCustomerStats = async (customerId) => {
  const [total, available, delivered, inProgress] = await Promise.all([
    Food.countDocuments({ customerId }),
    Food.countDocuments({ customerId, status: "available" }),
    Food.countDocuments({ customerId, status: "delivered" }),
    Food.countDocuments({ customerId, status: { $in: ["accepted", "assigned", "picked_up", "in_transit"] } }),
  ]);
  return { total, available, delivered, inProgress };
};
