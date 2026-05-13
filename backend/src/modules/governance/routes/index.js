import mongoose from "mongoose";
import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/rbac.middleware.js";
import { sendSuccess, sendError } from "../../../utils/response.util.js";
import * as notifService from "../services/notification.service.js";
import AuditLog from "../models/auditLog.model.js";
import Food from "../../customer/models/food.model.js";

const router = Router();

// Lazy-load User model (avoid circular import issues)
const getUser = () => mongoose.model("User");

// ─── Notification routes (any authenticated user) ─────────────────────────────

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const result = await notifService.getUserNotifications(req.auth.sub, req.query);
    return sendSuccess(res, { message: "Notifications fetched", data: result });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch notifications", code: "INTERNAL_SERVER_ERROR" });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    await notifService.markRead(req.auth.sub, req.params.id);
    return sendSuccess(res, { message: "Notification marked as read", data: null });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to mark notification", code: "INTERNAL_SERVER_ERROR" });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await notifService.markAllRead(req.auth.sub);
    return sendSuccess(res, { message: "All notifications marked as read", data: null });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to mark notifications", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── Admin-only routes below ──────────────────────────────────────────────────

router.use(requireAuth, requireRole("admin"));

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
    const [totalUsers, pendingUsers, approvedUsers, totalFoods, deliveredFoods] = await Promise.all([
      getUser().countDocuments({}),
      getUser().countDocuments({ approvalStatus: "pending" }),
      getUser().countDocuments({ approvalStatus: "approved" }),
      Food.countDocuments({}).catch(() => 0),
      Food.countDocuments({ status: "delivered" }).catch(() => 0),
    ]);

    return sendSuccess(res, {
      message: "Stats fetched",
      data: {
        users:     { total: totalUsers, pending: pendingUsers, approved: approvedUsers },
        donations: { total: totalFoods, delivered: deliveredFoods },
      }
    });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch stats", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── GET /governance/donations ────────────────────────────────────────────────
router.get("/donations", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [foods, total] = await Promise.all([
      Food.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate("customerId", "name email phone").lean(),
      Food.countDocuments(filter),
    ]);

    return sendSuccess(res, { message: "Donations fetched", data: { foods, total, page, pages: Math.ceil(total / limit) } });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch donations", code: "INTERNAL_SERVER_ERROR" });
  }
});

// ─── GET /governance/audit-logs ───────────────────────────────────────────────
router.get("/audit-logs", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 30);
    const filter = {};
    if (req.query.action) filter.action = req.query.action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return sendSuccess(res, { message: "Audit logs fetched", data: { logs, total, page, pages: Math.ceil(total / limit) } });
  } catch {
    return sendError(res, { statusCode: 500, message: "Failed to fetch audit logs", code: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;
