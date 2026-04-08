import mongoose from "mongoose";
import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/rbac.middleware.js";
import { sendSuccess, sendError } from "../../../utils/response.util.js";

const router = Router();

// All governance routes require admin role
router.use(requireAuth, requireRole("admin"));

// Lazy-load User model (avoid circular import issues)
const getUser = () => mongoose.model("User");

// ─── GET /governance/users/pending ───────────────────────────────────────────
router.get("/users/pending", async (req, res) => {
  try {
    const users = await getUser()
      .find({ approvalStatus: "pending" })
      .select("-passwordHash -refreshTokens")
      .sort({ createdAt: 1 })
      .lean();

    return sendSuccess(res, {
      message: `${users.length} pending user(s)`,
      data: { users, count: users.length }
    });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch pending users", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── PATCH /governance/users/:id/approve ─────────────────────────────────────
router.patch("/users/:id/approve", async (req, res) => {
  try {
    const { id }     = req.params;
    const { action } = req.body;  // "approved" | "rejected"

    if (!["approved", "rejected"].includes(action)) {
      return sendError(res, { statusCode: 400, message: "action must be 'approved' or 'rejected'", code: "VALIDATION_ERROR" });
    }

    const user = await getUser().findById(id);
    if (!user) return sendError(res, { statusCode: 404, message: "User not found", code: "NOT_FOUND" });
    if (user.role === "admin") return sendError(res, { statusCode: 403, message: "Cannot change admin approval status", code: "FORBIDDEN" });

    user.approvalStatus = action;
    await user.save();

    console.log(`[Admin] ${user.email} → ${action}`);

    return sendSuccess(res, {
      message: `User ${action} successfully`,
      data: { id: String(user._id), name: user.name, email: user.email, role: user.role, approvalStatus: user.approvalStatus }
    });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to update user", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── GET /governance/users ─────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const filter = {};
    if (req.query.role)   filter.role           = req.query.role;
    if (req.query.status) filter.approvalStatus = req.query.status;

    const [users, total] = await Promise.all([
      getUser().find(filter).select("-passwordHash -refreshTokens").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      getUser().countDocuments(filter),
    ]);

    return sendSuccess(res, { message: "Users fetched", data: { users, total, page, pages: Math.ceil(total / limit) } });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch users", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── PATCH /governance/users/:id/toggle-active ────────────────────────────────
router.patch("/users/:id/toggle-active", async (req, res) => {
  try {
    const user = await getUser().findById(req.params.id);
    if (!user) return sendError(res, { statusCode: 404, message: "User not found", code: "NOT_FOUND" });
    if (user.role === "admin") return sendError(res, { statusCode: 403, message: "Cannot disable admin accounts", code: "FORBIDDEN" });

    user.isActive = !user.isActive;
    await user.save();

    return sendSuccess(res, { message: `Account ${user.isActive ? "enabled" : "disabled"}`, data: { id: String(user._id), isActive: user.isActive } });
  } catch {
    return sendError(res, { statusCode: 500, message: "Action failed", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── GET /governance/stats ─────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    let Donation;
    try { Donation = mongoose.model("Donation"); } catch { Donation = null; }

    const [totalUsers, pendingUsers, approvedUsers, totalDonations, deliveredDonations] = await Promise.all([
      getUser().countDocuments({}),
      getUser().countDocuments({ approvalStatus: "pending" }),
      getUser().countDocuments({ approvalStatus: "approved" }),
      Donation ? Donation.countDocuments({}) : 0,
      Donation ? Donation.countDocuments({ status: "delivered" }) : 0,
    ]);

    return sendSuccess(res, {
      message: "Stats fetched",
      data: {
        users:     { total: totalUsers, pending: pendingUsers, approved: approvedUsers },
        donations: { total: totalDonations, delivered: deliveredDonations },
      }
    });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch stats", code: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;
