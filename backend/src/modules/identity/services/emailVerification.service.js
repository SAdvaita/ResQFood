/**
 * Email Verification Service
 * ──────────────────────────
 * Issues signed short-lived tokens and verifies them.
 * Uses OTP service internally (email_verify purpose).
 *
 * For link-based verification (magic links):
 *   - Generate a signed JWT with purpose=email_verify
 *   - Send link to user's email
 *   - User clicks → backend verifies token → marks emailVerified = true
 *
 * For 6-digit code verification:
 *   - Delegates to OTP service (sendOTP / verifyOTP)
 */

import jwt   from "jsonwebtoken";
import User  from "../models/user.model.js";
import { sendOTP, verifyOTP } from "./otp.service.js";
import { AppError } from "../../../utils/appError.util.js";
import { ENV } from "../../../config/env.js";
import { sendMail } from "../../../utils/mailer.util.js";

const LINK_EXPIRES = "30m"; // magic-link expiry
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertValidEmail = (email) => {
  if (!EMAIL_PATTERN.test(String(email || "").trim().toLowerCase())) {
    throw new AppError("Not correct mailID", 400, "VALIDATION_ERROR");
  }
};

// ─── Send OTP Code ────────────────────────────────────────────────────────────

/**
 * Send a 6-digit email verification OTP.
 * @param {string} userId
 */
export const sendEmailVerificationOTP = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.emailVerified) throw new AppError("Email already verified", 409, "CONFLICT");
  assertValidEmail(user.email);

  const otpResult = await sendOTP(user.email, "email_verify");
  return {
    message: `Verification code sent to ${user.email}`,
    ...(process.env.NODE_ENV !== "production"
      ? {
          deliveryMode: otpResult?.mode ?? null,
          ...(otpResult?.devCode ? { devCode: otpResult.devCode } : {}),
        }
      : {}),
  };
};

// ─── Verify OTP Code ──────────────────────────────────────────────────────────

/**
 * Confirm the 6-digit code and mark email as verified.
 * @param {string} userId
 * @param {string} code
 */
export const confirmEmailOTP = async (userId, code) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.emailVerified) throw new AppError("Email already verified", 409, "CONFLICT");

  await verifyOTP(user.email, "email_verify", code);

  user.emailVerified   = true;
  user.emailVerifiedAt = new Date();
  await user.save();

  return { message: "Email verified successfully" };
};

// ─── Send Magic Link ──────────────────────────────────────────────────────────

/**
 * Generate a signed JWT magic-link and email it to the user.
 * @param {string} userId
 */
export const sendEmailVerificationLink = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.emailVerified) throw new AppError("Email already verified", 409, "CONFLICT");
  assertValidEmail(user.email);

  const token = jwt.sign(
    { sub: String(user._id), purpose: "email_verify" },
    ENV.ACCESS_TOKEN_SECRET,
    { expiresIn: LINK_EXPIRES }
  );

  const link = `${ENV.FRONTEND_ORIGIN}/verify-email?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "Verify your ResQFood email",
    text: `Click this link to verify your email (valid 30 minutes): ${link}`,
    html: `<p>Click this link to verify your email (valid 30 minutes):</p><p><a href="${link}">${link}</a></p>`,
  });

  return { message: `Verification link sent to ${user.email}` };
};

// ─── Confirm Magic Link Token ─────────────────────────────────────────────────

/**
 * Verify the JWT in the magic link and mark email as verified.
 * @param {string} token  – from query param
 */
export const confirmEmailLink = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET);
  } catch {
    throw new AppError("Verification link is invalid or expired", 400, "TOKEN_INVALID");
  }

  if (decoded.purpose !== "email_verify") {
    throw new AppError("Invalid token purpose", 400, "TOKEN_INVALID");
  }

  const user = await User.findById(decoded.sub);
  if (!user)           throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.emailVerified) return { message: "Email already verified" };

  user.emailVerified   = true;
  user.emailVerifiedAt = new Date();
  await user.save();

  return { message: "Email verified successfully" };
};
