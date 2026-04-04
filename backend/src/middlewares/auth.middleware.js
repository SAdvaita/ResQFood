import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { AppError } from "../utils/appError.util.js";

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      throw new AppError("Access token missing", 401, "UNAUTHORIZED");
    }

    const decoded = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET);
    req.auth = decoded;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired access token", 401, "UNAUTHORIZED"));
  }
};
