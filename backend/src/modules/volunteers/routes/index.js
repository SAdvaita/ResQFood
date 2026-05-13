import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/rbac.middleware.js";
import * as volCtrl from "../controllers/volunteer.controller.js";

const router = Router();

// All volunteer routes require auth + volunteer role (auto-approved, no requireApproved needed)
router.use(requireAuth, requireRole("volunteer"));

// ─── Assignments ──────────────────────────────────────────────────────────────
router.get("/assignments/available",    volCtrl.getAvailableAssignments);
router.post("/assignments/:foodId/accept", volCtrl.acceptAssignment);
router.patch("/assignments/:id/status", volCtrl.updateAssignmentStatus);
router.get("/assignments/active",       volCtrl.getActiveAssignment);
router.get("/assignments/history",       volCtrl.getAssignmentHistory);

// ─── Profile & Availability ───────────────────────────────────────────────────
router.get("/profile",                   volCtrl.getProfile);
router.put("/profile",                   volCtrl.updateProfile);
router.patch("/availability",            volCtrl.toggleAvailability);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats",                     volCtrl.getStats);

// ─── Rewards ──────────────────────────────────────────────────────────────────
router.get("/rewards",                   volCtrl.getRewards);
router.post("/rewards/:id/redeem",       volCtrl.redeemReward);

export default router;
