import { AppError } from "../utils/appError.util.js";

/**
 * requireRole(...roles)
 * Must be used AFTER requireAuth (which sets req.auth)
 * Usage: requireRole("admin"), requireRole("customer","employee")
 */
export const requireRole = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    }

    const { role } = req.auth;

    if (!allowedRoles.includes(role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
          403,
          "FORBIDDEN"
        )
      );
    }

    return next();
  };
};

/**
 * requireApproved
 * Ensures the user has approvalStatus === "approved"
 * Must be used AFTER requireAuth
 */
export const requireApproved = (req, _res, next) => {
  if (!req.auth) {
    return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
  }

  if (req.auth.approvalStatus !== "approved") {
    return next(
      new AppError(
        "Your account is pending admin approval. Please wait for approval before accessing this feature.",
        403,
        "PENDING_APPROVAL"
      )
    );
  }

  return next();
};
