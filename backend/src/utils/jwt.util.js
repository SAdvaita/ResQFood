import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { ENV } from "../config/env.js";

const buildClaims = (user) => ({
  sub: String(user._id),
  role: user.role,
  jti: randomBytes(8).toString("hex")
});

export const createAccessToken = (user) => {
  return jwt.sign(buildClaims(user), ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: ENV.ACCESS_TOKEN_EXPIRES
  });
};

export const createRefreshToken = (user) => {
  return jwt.sign(buildClaims(user), ENV.REFRESH_TOKEN_SECRET, {
    expiresIn: ENV.REFRESH_TOKEN_EXPIRES
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, ENV.REFRESH_TOKEN_SECRET);
};
