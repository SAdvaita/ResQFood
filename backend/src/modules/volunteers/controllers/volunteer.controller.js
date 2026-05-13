import * as volService from "../services/volunteer.service.js";
import { sendSuccess, sendError } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.util.js";

const handle = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    console.error(err);
    return sendError(res, { statusCode: 500, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const getAvailableAssignments = handle(async (req, res) => {
  const result = await volService.getAvailableAssignments(req.auth.sub, req.query);
  return sendSuccess(res, { message: "Available pickups fetched", data: result });
});

export const acceptAssignment = handle(async (req, res) => {
  const assignment = await volService.acceptAssignment(req.auth.sub, req.params.foodId);
  return sendSuccess(res, { statusCode: 201, message: "Delivery accepted", data: { assignment } });
});

export const updateAssignmentStatus = handle(async (req, res) => {
  const { status } = req.body;
  if (!status) return sendError(res, { statusCode: 400, message: "status is required", code: "VALIDATION_ERROR" });
  const assignment = await volService.updateAssignmentStatus(req.auth.sub, req.params.id, status);
  return sendSuccess(res, { message: `Status updated to '${status}'`, data: { assignment } });
});

export const getActiveAssignment = handle(async (req, res) => {
  const assignment = await volService.getActiveAssignment(req.auth.sub);
  return sendSuccess(res, { message: assignment ? "Active assignment fetched" : "No active assignment", data: { assignment } });
});

export const getAssignmentHistory = handle(async (req, res) => {
  const result = await volService.getAssignmentHistory(req.auth.sub, req.query);
  return sendSuccess(res, { message: "History fetched", data: result });
});

export const getStats = handle(async (req, res) => {
  const stats = await volService.getVolunteerStats(req.auth.sub);
  return sendSuccess(res, { message: "Stats fetched", data: stats });
});

export const getProfile = handle(async (req, res) => {
  const profile = await volService.getVolunteerProfile(req.auth.sub);
  return sendSuccess(res, { message: "Profile fetched", data: { profile } });
});

export const updateProfile = handle(async (req, res) => {
  const profile = await volService.updateVolunteerProfile(req.auth.sub, req.body);
  return sendSuccess(res, { message: "Profile updated", data: { profile } });
});

export const toggleAvailability = handle(async (req, res) => {
  const result = await volService.toggleAvailability(req.auth.sub);
  return sendSuccess(res, { message: `You are now ${result.isAvailable ? "online" : "offline"}`, data: result });
});

export const getRewards = handle(async (req, res) => {
  const rewards = await volService.getRewards();
  return sendSuccess(res, { message: "Rewards fetched", data: { rewards } });
});

export const redeemReward = handle(async (req, res) => {
  const redemption = await volService.redeemReward(req.auth.sub, req.params.id);
  return sendSuccess(res, { statusCode: 201, message: "Reward redeemed", data: { redemption } });
});
