import { Router } from "express";
import { register, login, logout, refresh } from "../controllers/auth.controller.js";
import { requireAuth } from "../../../middlewares/auth.middleware.js";

const authRouter = Router();

// Server.js → Global Router → Identity Router → Auth Router → Controller → Service

authRouter.post("/register", register);
authRouter.post("/login",    login);
authRouter.post("/logout",   requireAuth, logout);  // requireAuth to get req.auth.sub for token revocation
authRouter.post("/refresh",  refresh);

export default authRouter;
