import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../../../utils/jwt.util.js";
import { AppError } from "../../../utils/appError.util.js";

const SALT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────

const registerUser = async (payload) => {
  const { name, email, phone, password, role, address, coordinates } = payload;

  // uniqueness check
  const existing = await User.findOne({
    $or: [
      { email: email.toLowerCase().trim() },
      { phone: phone.trim() }
    ]
  });

  if (existing) {
    throw new AppError(
      "An account with this email or phone already exists",
      409,
      "CONFLICT"
    );
  }

  // hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // volunteers are auto-approved; customers and NGOs need admin approval
  const approvalStatus =
    role === "volunteer" || role === "admin" ? "approved" : "pending";

  // build location if coordinates provided
  const location =
    Array.isArray(coordinates) && coordinates.length === 2
      ? { type: "Point", coordinates }
      : undefined;

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    approvalStatus,
    address: address ?? null,
    ...(location && { location })
  });

  // generate tokens
  const accessToken  = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  // store refresh token in DB
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { token: refreshToken } } }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id:             String(user._id),
      name:           user.name,
      role:           user.role,
      approvalStatus: user.approvalStatus
    }
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const loginUser = async (identifier, password) => {
  const user = await User.findByIdentifier(identifier);

  if (!user) {
    throw new AppError("Invalid credentials", 401, "UNAUTHORIZED");
  }

  if (!user.isActive) {
    throw new AppError("Account is disabled. Contact support.", 403, "FORBIDDEN");
  }

  // check lockout
  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new AppError(
      `Account locked. Try again in ${minutesLeft} minute(s).`,
      429,
      "ACCOUNT_LOCKED",
      { lockUntil: user.lockUntil }
    );
  }

  // compare password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await user.incrementLoginAttempts();

    // re-fetch to get updated attempt count
    const refreshed = await User.findById(user._id);
    const attemptsLeft = Math.max(0, 4 - refreshed.loginAttempts);

    if (refreshed.isLocked) {
      throw new AppError(
        "Too many failed attempts. Account locked for 5 minutes.",
        429,
        "ACCOUNT_LOCKED",
        { lockUntil: refreshed.lockUntil }
      );
    }

    throw new AppError(
      `Invalid credentials. ${attemptsLeft} attempt(s) remaining before lockout.`,
      401,
      "UNAUTHORIZED",
      { attemptsRemaining: attemptsLeft }
    );
  }

  // successful login – reset attempts
  await user.resetLoginAttempts();

  // generate tokens
  const accessToken  = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  // store new refresh token, keep max 5 sessions
  const trimUpdate = user.refreshTokens.length >= 5
    ? { $pop: { refreshTokens: -1 } }   // remove oldest
    : null;

  if (trimUpdate) {
    await User.updateOne({ _id: user._id }, trimUpdate);
  }

  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { token: refreshToken } } }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id:             String(user._id),
      name:           user.name,
      role:           user.role,
      approvalStatus: user.approvalStatus
    }
  };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logoutUser = async (userId, refreshToken) => {
  // remove specific refresh token from DB
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { token: refreshToken } } }
  );

  return { message: "Logged out successfully" };
};

// ─── Refresh Session ──────────────────────────────────────────────────────────

const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401, "UNAUTHORIZED");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401, "UNAUTHORIZED");
  }

  // confirm token exists in DB (prevents reuse after logout)
  const user = await User.findOne({
    _id:                  decoded.sub,
    "refreshTokens.token": refreshToken
  });

  if (!user) {
    throw new AppError("Refresh token revoked", 401, "UNAUTHORIZED");
  }

  const newAccessToken = createAccessToken(user);

  return {
    accessToken: newAccessToken,
    user: {
      id:             String(user._id),
      name:           user.name,
      role:           user.role,
      approvalStatus: user.approvalStatus
    }
  };
};

export { registerUser, loginUser, logoutUser, refreshSession };
