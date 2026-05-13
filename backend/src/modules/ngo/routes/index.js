import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { requireRole, requireApproved } from "../../../middlewares/rbac.middleware.js";
import * as ngoCtrl from "../controllers/ngo.controller.js";

const router = Router();

// All NGO routes require auth + ngo role + approved status
router.use(requireAuth, requireRole("ngo"), requireApproved);

// ─── Browse & Claim Food ──────────────────────────────────────────────────────
router.get("/food/available",    ngoCtrl.getAvailableFood);
router.post("/food/:id/claim",   ngoCtrl.claimFood);
router.get("/claims",            ngoCtrl.getMyClaims);

// ─── Food Requests ────────────────────────────────────────────────────────────
router.post("/food-requests",    ngoCtrl.createFoodRequest);
router.get("/food-requests",     ngoCtrl.getMyFoodRequests);

// ─── Impact Stories ───────────────────────────────────────────────────────────
router.post("/impact-stories",   ngoCtrl.createImpactStory);
router.get("/impact-stories",    ngoCtrl.getImpactStories);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get("/profile",           ngoCtrl.getNgoProfile);
router.put("/profile",           ngoCtrl.updateNgoProfile);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats",             ngoCtrl.getNgoStats);

export default router;
