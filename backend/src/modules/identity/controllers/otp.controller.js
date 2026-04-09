/**
 * OTP & Email Verification Controller
 * Handles:
 *  - Send phone OTP
 *  - Verify phone OTP
 *  - Send email verification (OTP code or magic link)
 *  - Confirm email verification
 *  - Password reset via OTP
 */

import { sendOTP, verifyOTP }                          from "../services/otp.service.js";
import {
  sendEmailVerificationOTP,
  confirmEmailOTP,
  sendEmailVerificationLink,
  confirmEmailLink,
}                                                      from "../services/emailVerification.service.js";
import User                                            from "../models/user.model.js";
import { sendSuccess, sendError }                      from "../../../utils/response.util.js";
import { AppError }                                    from "../../../utils/appError.util.js";
import bcrypt                                          from "bcryptjs";

// ─── Send Phone OTP ──────────────────────────────────────────────────────────

export const sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return sendError(res, { statusCode: 400, message: "Phone is required", code: "VALIDATION_ERROR" });

    await sendOTP(phone.trim(), "phone_verify");
    return sendSuccess(res, { message: "OTP sent to your phone", data: null });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Failed to send OTP", code: "INTERNAL_SERVER_ERROR" });
  }
};

// ─── Verify Phone OTP ────────────────────────────────────────────────────────

export const verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return sendError(res, { statusCode: 400, message: "Phone and code are required", code: "VALIDATION_ERROR" });

    await verifyOTP(phone.trim(), "phone_verify", String(code));

    // Mark phone as verified in user document if user exists
    await User.updateOne(
      { phone: phone.trim() },
      { $set: { phoneVerified: true } }
    );

    return sendSuccess(res, { message: "Phone verified successfully", data: null });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code, details: err.details });
    return sendError(res, { statusCode: 500, message: "OTP verification failed", code: "INTERNAL_SERVER_ERROR" });
  }
};

// ─── Send Email Verification OTP ─────────────────────────────────────────────

export const sendEmailOTP = async (req, res) => {
  try {
    const userId = req.auth?.sub;
    const result = await sendEmailVerificationOTP(userId);
    return sendSuccess(res, {
      message: result.message,
      data:
        process.env.NODE_ENV !== "production"
          ? {
              deliveryMode: result.deliveryMode ?? null,
              ...(result.devCode ? { devCode: result.devCode } : {}),
            }
          : null,
    });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Failed to send email OTP", code: "INTERNAL_SERVER_ERROR" });
  }
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────

export const verifyEmailOTP = async (req, res) => {
  try {
    const userId  = req.auth?.sub;
    const { code } = req.body;
    if (!code) return sendError(res, { statusCode: 400, message: "Verification code is required", code: "VALIDATION_ERROR" });

    const result = await confirmEmailOTP(userId, String(code));
    return sendSuccess(res, { message: result.message, data: null });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code, details: err.details });
    return sendError(res, { statusCode: 500, message: "Email verification failed", code: "INTERNAL_SERVER_ERROR" });
  }
};

// ─── Send Magic Link ─────────────────────────────────────────────────────────

export const sendVerifyLink = async (req, res) => {
  try {
    const userId = req.auth?.sub;
    const result = await sendEmailVerificationLink(userId);
    return sendSuccess(res, { message: result.message, data: null });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Failed to send verification link", code: "INTERNAL_SERVER_ERROR" });
  }
};

// ─── Confirm Magic Link ──────────────────────────────────────────────────────

export const confirmVerifyLink = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return sendError(res, { statusCode: 400, message: "Token is required", code: "VALIDATION_ERROR" });

    const result = await confirmEmailLink(token);
    return sendSuccess(res, { message: result.message, data: null });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    return sendError(res, { statusCode: 500, message: "Email verification failed", code: "INTERNAL_SERVER_ERROR" });
  }
};

// ─── Request Password Reset ──────────────────────────────────────────────────

export const requestPasswordReset = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return sendError(res, { statusCode: 400, message: "Email or phone is required", code: "VALIDATION_ERROR" });

    // Check user exists (but don't leak whether they do or not)
    const user = await User.findByIdentifier(identifier);
    let otpResult = null;
    if (user) {
      otpResult = await sendOTP(identifier.trim(), "password_reset");
    }

    // Always return success to prevent email enumeration
    return sendSuccess(res, {
      message: "If an account exists, a reset code has been sent.",
      data:
        process.env.NODE_ENV !== "production" && otpResult
          ? {
              deliveryMode: otpResult.mode,
              ...(otpResult.devCode ? { devCode: otpResult.devCode } : {}),
            }
          : null,
    });
  } catch (err) {
    return sendError(res, { statusCode: 500, message: "Reset request failed", code: "INTERNAL_SERVER_ERROR" });
  }
};

// ─── Confirm Password Reset ──────────────────────────────────────────────────

export const confirmPasswordReset = async (req, res) => {
  try {
    const { identifier, code, newPassword } = req.body;

    if (!identifier || !code || !newPassword) {
      return sendError(res, { statusCode: 400, message: "identifier, code, and newPassword are required", code: "VALIDATION_ERROR" });
    }
    if (newPassword.length < 8) {
      return sendError(res, { statusCode: 400, message: "Password must be at least 8 characters", code: "VALIDATION_ERROR" });
    }

    await verifyOTP(identifier.trim(), "password_reset", String(code));

    const user = await User.findByIdentifier(identifier);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    // Invalidate all refresh tokens on password reset
    user.refreshTokens = [];
    await user.save();

    return sendSuccess(res, { message: "Password reset successfully. Please sign in again.", data: null });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code, details: err.details });
    return sendError(res, { statusCode: 500, message: "Password reset failed", code: "INTERNAL_SERVER_ERROR" });
  }
};
