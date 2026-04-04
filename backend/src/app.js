import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import globalRouter from "./routes/server.js";
import { ENV } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({
  origin: ENV.FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/api/v1", globalRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
