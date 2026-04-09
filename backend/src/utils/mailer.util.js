import nodemailer from "nodemailer";
import { AppError } from "./appError.util.js";

const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

const smtpConfigured =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS) &&
  Boolean(process.env.SMTP_FROM);

let transporter = null;

const getTransporter = () => {
  if (!smtpConfigured) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

export const isSmtpConfigured = () => smtpConfigured;

export const sendMail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();

  if (!tx) {
    // Development fallback so OTP/link is still visible during local testing.
    console.log(`\n📧 [EMAIL MOCK] → ${to}\n   Subject: ${subject}\n   Body: ${text}\n`);
    return { delivered: false, mode: "mock" };
  }

  try {
    await tx.sendMail({
      from: `"ResQFood" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
  } catch (error) {
    if (error?.code === "EAUTH") {
      throw new AppError(
        "SMTP authentication failed. Check SMTP_USER/SMTP_PASS and use a Google App Password.",
        500,
        "SMTP_AUTH_FAILED"
      );
    }

    if (error?.code === "ESOCKET" || error?.code === "ETIMEDOUT") {
      throw new AppError(
        "SMTP connection failed. Check SMTP_HOST/SMTP_PORT/SMTP_SECURE and your network.",
        500,
        "SMTP_CONNECTION_FAILED"
      );
    }

    throw new AppError(
      `SMTP send failed: ${error?.message || "Unknown error"}`,
      500,
      "SMTP_SEND_FAILED"
    );
  }

  return { delivered: true, mode: "smtp" };
};