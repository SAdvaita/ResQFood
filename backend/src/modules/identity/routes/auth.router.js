import { Router }         from "express";
import { register, login, logout, refresh } from "../controllers/auth.controller.js";
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  sendEmailOTP,
  verifyEmailOTP,
  sendVerifyLink,
  confirmVerifyLink,
  requestPasswordReset,
  confirmPasswordReset,
}                          from "../controllers/otp.controller.js";
import { requireAuth }     from "../../../middlewares/auth.middleware.js";
import User                from "../models/user.model.js";
import { sendSuccess, sendError } from "../../../utils/response.util.js";

const authRouter = Router();

// ─── Core Auth ────────────────────────────────────────────────────────────────
authRouter.post("/register", register);
authRouter.post("/login",    login);
authRouter.post("/logout",   requireAuth, logout);
authRouter.post("/refresh",  refresh);

// ─── Current User Profile ─────────────────────────────────────────────────────
authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.sub)
      .select("-passwordHash -refreshTokens")
      .lean();
    if (!user) return sendError(res, { statusCode: 404, message: "User not found", code: "NOT_FOUND" });
    return sendSuccess(res, { message: "Profile fetched", data: { user } });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch profile", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── Phone OTP ────────────────────────────────────────────────────────────────
authRouter.post("/otp/phone/send",   sendPhoneOTP);
authRouter.post("/otp/phone/verify", verifyPhoneOTP);

// ─── Email Verification (OTP code) ───────────────────────────────────────────
authRouter.post("/verify-email/send",   requireAuth, sendEmailOTP);
authRouter.post("/verify-email/confirm", requireAuth, verifyEmailOTP);

// ─── Email Verification (Magic Link) ─────────────────────────────────────────
authRouter.post("/verify-email/link",    requireAuth, sendVerifyLink);
authRouter.get ("/verify-email/confirm-link",        confirmVerifyLink);  // GET – user clicks link

// ─── Password Reset ───────────────────────────────────────────────────────────
authRouter.post("/password-reset/request", requestPasswordReset);
authRouter.post("/password-reset/confirm", confirmPasswordReset);

export default authRouter;
