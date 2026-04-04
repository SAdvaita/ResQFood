import { registerUser, loginUser, logoutUser, refreshSession } from "../services/auth.service.js";
import { validateRegisterPayload } from "../validators/register.validator.js";
import { sendSuccess, sendError } from "../../../utils/response.util.js";
import { refreshCookieOptions } from "../../../utils/cookie.util.js";
import { AppError } from "../../../utils/appError.util.js";

// ─── Register ─────────────────────────────────────────────────────────────────

const register = async (req, res) => {
  try {
    validateRegisterPayload(req.body);
    const result = await registerUser(req.body);

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    return sendSuccess(res, {
      statusCode: 201,
      message:    "Account created successfully",
      data: {
        accessToken: result.accessToken,
        user:        result.user
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, {
        statusCode: 409,
        message: "An account with this email or phone already exists",
        code: "CONFLICT"
      });
    }

    if (error instanceof AppError) {
      return sendError(res, {
        statusCode: error.statusCode,
        message:    error.message,
        code:       error.code,
        details:    error.details
      });
    }
    return sendError(res, {
      statusCode: 500,
      message:    "Registration failed",
      code:       "INTERNAL_SERVER_ERROR"
    });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return sendError(res, {
        statusCode: 400,
        message:    "Email/phone and password are required",
        code:       "VALIDATION_ERROR"
      });
    }

    const result = await loginUser(identifier, password);

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    return sendSuccess(res, {
      statusCode: 200,
      message:    "Login successful",
      data: {
        accessToken: result.accessToken,
        user:        result.user
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, {
        statusCode: error.statusCode,
        message:    error.message,
        code:       error.code,
        details:    error.details
      });
    }
    return sendError(res, {
      statusCode: 500,
      message:    "Login failed",
      code:       "INTERNAL_SERVER_ERROR"
    });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const userId       = req.auth?.sub;   // set by requireAuth middleware if used

    // best-effort logout – even without a valid token we clear the cookie
    if (userId && refreshToken) {
      await logoutUser(userId, refreshToken);
    }

    // clear cookie from browser
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      path:     "/"
    });

    return sendSuccess(res, {
      statusCode: 200,
      message:    "Logged out successfully",
      data:       null
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message:    "Logout failed",
      code:       "INTERNAL_SERVER_ERROR"
    });
  }
};

// ─── Refresh Session ──────────────────────────────────────────────────────────

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const result       = await refreshSession(refreshToken);

    return sendSuccess(res, {
      statusCode: 200,
      message:    "Token refreshed",
      data: {
        accessToken: result.accessToken,
        user:        result.user
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, {
        statusCode: error.statusCode,
        message:    error.message,
        code:       error.code
      });
    }
    return sendError(res, {
      statusCode: 500,
      message:    "Token refresh failed",
      code:       "INTERNAL_SERVER_ERROR"
    });
  }
};

export { register, login, logout, refresh };
