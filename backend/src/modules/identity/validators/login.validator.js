import { AppError } from "../../../utils/appError.util.js";

export const validateLoginPayload = (payload) => {
  if (!payload.identifier || !payload.password) {
    throw new AppError("identifier and password are required", 400, "VALIDATION_ERROR");
  }
};
