import * as foodService from "../services/food.service.js";
import { sendSuccess, sendError } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.util.js";

export const createFood = async (req, res) => {
  try {
    const food = await foodService.createFood(req.auth.sub, req.body);
    return sendSuccess(res, { statusCode: 201, message: "Food listed successfully", data: { food } });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Failed to create food listing", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const getMyFoods = async (req, res) => {
  try {
    const result = await foodService.getMyFoods(req.auth.sub, req.query);
    return sendSuccess(res, { message: "Foods fetched", data: result });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: "Failed to fetch foods", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const getFoodById = async (req, res) => {
  try {
    const food = await foodService.getFoodById(req.params.id, req.auth.sub);
    return sendSuccess(res, { message: "Food fetched", data: { food } });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Failed to fetch food", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const updateFood = async (req, res) => {
  try {
    const food = await foodService.updateFood(req.params.id, req.auth.sub, req.body);
    return sendSuccess(res, { message: "Food updated", data: { food } });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Failed to update food", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const cancelFood = async (req, res) => {
  try {
    const food = await foodService.cancelFood(req.params.id, req.auth.sub);
    return sendSuccess(res, { message: "Food listing cancelled", data: { food } });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Failed to cancel food", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await foodService.getCustomerStats(req.auth.sub);
    return sendSuccess(res, { message: "Stats fetched", data: stats });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: "Failed to fetch stats", code: "INTERNAL_SERVER_ERROR" });
  }
};
