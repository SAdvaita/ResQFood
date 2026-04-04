import { Router } from "express";
import { sendSuccess } from "../utils/response.util.js";

// ─── Module Routers ───────────────────────────────────────────────────────────
import identityRouter    from "../modules/identity/routes/index.js";
import governanceRouter  from "../modules/governance/routes/index.js";
import ngoRouter         from "../modules/ngo/routes/index.js";
import customerRouter    from "../modules/customer/routes/index.js";
import volunteersRouter  from "../modules/volunteers/routes/index.js";

const router = Router();

// ─── Route Aggregation ────────────────────────────────────────────────────────
// All module routes are combined here and mounted under /api/v1 in app.js

router.get("/health", (req, res) => {
	return sendSuccess(res, {
		message: "OK",
		data: { status: "up" }
	});
});

router.use("/identity",    identityRouter);    // /api/v1/identity/auth/*
router.use("/governance",  governanceRouter);  // /api/v1/governance/*
router.use("/ngo",         ngoRouter);         // /api/v1/ngo/*
router.use("/customer",    customerRouter);    // /api/v1/customer/*
router.use("/volunteers",  volunteersRouter);  // /api/v1/volunteers/*

export default router;
