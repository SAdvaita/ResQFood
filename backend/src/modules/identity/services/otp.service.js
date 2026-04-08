/**
 * OTP Service
 * ───────────
 * Generates, sends, and verifies one-time passwords.
 *
 * Current mode: MOCK (logs OTP to console).
 * Switch to LIVE by setting TWILIO_* and EMAIL_* env vars and
 * uncommenting the Twilio / nodemailer blocks below.
 */

import crypto    from "crypto";
import bcrypt    from "bcryptjs";
import OTP       from "../models/otp.model.js";
import { AppError } from "../../../utils/appError.util.js";

const OTP_LENGTH     = 6;
const OTP_EXPIRES_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS   = 5;
const BCRYPT_ROUNDS  = 8;              // lower for speed (OTPs are short-lived)

// ─── Generate plain OTP ───────────────────────────────────────────────────────

const generatePlainOTP = () =>
  String(Math.floor(Math.random() * 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

// ─── Send via SMS (Twilio-ready) ─────────────────────────────────────────────

const sendSms = async (phone, message) => {
  /* ── LIVE: uncomment when Twilio is configured ──────────────────────────
  const twilio = (await import("twilio")).default;
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to:   phone,
  });
  ────────────────────────────────────────────────────────────────────────── */

  // MOCK: log to console
  console.log(`\n📱 [SMS MOCK] → ${phone}\n   ${message}\n`);
};

// ─── Send via Email (nodemailer-ready) ────────────────────────────────────────

const sendEmail = async (email, subject, body) => {
  /* ── LIVE: uncomment when nodemailer is configured ──────────────────────
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"ResQFood" <${process.env.SMTP_FROM}>`,
    to:   email,
    subject,
    text: body,
    html: `<p>${body}</p>`,
  });
  ────────────────────────────────────────────────────────────────────────── */

  // MOCK: log to console
  console.log(`\n📧 [EMAIL MOCK] → ${email}\n   Subject: ${subject}\n   Body: ${body}\n`);
};

// ─── Public: sendOTP ──────────────────────────────────────────────────────────

/**
 * @param {string} identifier  – phone number or email address
 * @param {"phone_verify"|"email_verify"|"password_reset"|"login_2fa"} purpose
 * @returns {Promise<void>}
 */
export const sendOTP = async (identifier, purpose) => {
  // Invalidate any existing OTP for this identifier + purpose
  await OTP.deleteMany({ identifier: identifier.toLowerCase().trim(), purpose });

  const plain     = generatePlainOTP();
  const codeHash  = await bcrypt.hash(plain, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS);

  await OTP.create({
    identifier: identifier.toLowerCase().trim(),
    purpose,
    codeHash,
    expiresAt,
  });

  const message = `Your ResQFood OTP is: ${plain}. Valid for 10 minutes. Do not share it.`;

  const isEmail = identifier.includes("@");
  if (isEmail) {
    await sendEmail(identifier, "ResQFood – Your OTP Code", message);
  } else {
    await sendSms(identifier, message);
  }
};

// ─── Public: verifyOTP ────────────────────────────────────────────────────────

/**
 * @param {string} identifier
 * @param {"phone_verify"|"email_verify"|"password_reset"|"login_2fa"} purpose
 * @param {string} plainCode  – the 6-digit code the user typed
 * @returns {Promise<boolean>} true if valid
 * @throws AppError on invalid / expired / too many attempts
 */
export const verifyOTP = async (identifier, purpose, plainCode) => {
  const record = await OTP.findOne({
    identifier: identifier.toLowerCase().trim(),
    purpose,
    used:       false,
    expiresAt:  { $gt: new Date() },
  });

  if (!record) {
    throw new AppError(
      "OTP not found or expired. Request a new one.",
      400,
      "OTP_INVALID"
    );
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    throw new AppError(
      "Too many OTP attempts. Request a new OTP.",
      429,
      "OTP_TOO_MANY_ATTEMPTS"
    );
  }

  const match = await bcrypt.compare(String(plainCode).trim(), record.codeHash);

  if (!match) {
    record.attempts += 1;
    await record.save();
    const left = MAX_ATTEMPTS - record.attempts;
    throw new AppError(
      `Invalid OTP. ${left} attempt(s) remaining.`,
      400,
      "OTP_INVALID",
      { attemptsRemaining: left }
    );
  }

  // Mark as used
  record.used = true;
  await record.save();

  return true;
};
