import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { requireRole, requireApproved } from "../../../middlewares/rbac.middleware.js";
import * as foodCtrl from "../controllers/food.controller.js";

const router = Router();

// All customer routes require auth + customer/employee role + approved status
router.use(requireAuth, requireRole("customer", "employee"), requireApproved);

// ─── Food CRUD ────────────────────────────────────────────────────────────────
router.post("/food",             foodCtrl.createFood);
router.get("/food",              foodCtrl.getMyFoods);
router.get("/food/:id",          foodCtrl.getFoodById);
router.patch("/food/:id",        foodCtrl.updateFood);
router.patch("/food/:id/cancel", foodCtrl.cancelFood);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats",             foodCtrl.getStats);

export default router;
