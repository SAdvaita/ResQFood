import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
  await mongoose.connect(ENV.MONGODB_URI, {
    autoIndex: true
  });
};
