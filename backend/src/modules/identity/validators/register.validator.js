import { AppError } from "../../../utils/appError.util.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegisterPayload = (payload) => {
  const required = ["name", "email", "phone", "password", "role"];
  const allowedRoles = ["customer", "ngo", "volunteer", "admin", "employee"];

  for (const key of required) {
    if (!payload[key]) {
      throw new AppError(`${key} is required`, 400, "VALIDATION_ERROR");
    }
  }

  if (!EMAIL_PATTERN.test(String(payload.email).trim().toLowerCase())) {
    throw new AppError("Not correct mailID", 400, "VALIDATION_ERROR");
  }

  if (payload.password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400, "VALIDATION_ERROR");
  }

  if (!allowedRoles.includes(payload.role)) {
    throw new AppError("Invalid role", 400, "VALIDATION_ERROR");
  }
};
