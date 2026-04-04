import { Router } from "express";
import authRouter from "./auth.router.js";

const identityRouter = Router();

identityRouter.use("/auth", authRouter);

export default identityRouter;
