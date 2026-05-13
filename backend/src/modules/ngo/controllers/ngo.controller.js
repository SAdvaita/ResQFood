import * as ngoService from "../services/ngo.service.js";
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

export const getAvailableFood = handle(async (req, res) => {
  const result = await ngoService.getAvailableFood(req.query);
  return sendSuccess(res, { message: "Available food fetched", data: result });
});

export const claimFood = handle(async (req, res) => {
  const food = await ngoService.claimFood(req.auth.sub, req.params.id);
  return sendSuccess(res, { message: "Food claimed successfully", data: { food } });
});

export const getMyClaims = handle(async (req, res) => {
  const result = await ngoService.getMyClaims(req.auth.sub, req.query);
  return sendSuccess(res, { message: "Claims fetched", data: result });
});

export const getNgoStats = handle(async (req, res) => {
  const stats = await ngoService.getNgoStats(req.auth.sub);
  return sendSuccess(res, { message: "Stats fetched", data: stats });
});

export const createFoodRequest = handle(async (req, res) => {
  const request = await ngoService.createFoodRequest(req.auth.sub, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Food request created", data: { request } });
});

export const getMyFoodRequests = handle(async (req, res) => {
  const result = await ngoService.getMyFoodRequests(req.auth.sub, req.query);
  return sendSuccess(res, { message: "Food requests fetched", data: result });
});

export const createImpactStory = handle(async (req, res) => {
  const story = await ngoService.createImpactStory(req.auth.sub, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Impact story created", data: { story } });
});

export const getImpactStories = handle(async (req, res) => {
  const result = await ngoService.getImpactStories(req.auth.sub, req.query);
  return sendSuccess(res, { message: "Impact stories fetched", data: result });
});

export const getNgoProfile = handle(async (req, res) => {
  const profile = await ngoService.getNgoProfile(req.auth.sub);
  return sendSuccess(res, { message: "Profile fetched", data: { profile } });
});

export const updateNgoProfile = handle(async (req, res) => {
  const profile = await ngoService.updateNgoProfile(req.auth.sub, req.body);
  return sendSuccess(res, { message: "Profile updated", data: { profile } });
});
