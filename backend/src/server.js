import app from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { sendSuccess } from "./utils/response.util.js";

let activePort = ENV.PORT;

const bootstrap = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");
    
    // Add root endpoint for status check
    app.get("/", (req, res) => {
      return sendSuccess(res, {
        message: "ResQFood Backend API",
        data: {
          status: "running",
          port: activePort,
          version: "1.0.0",
          endpoints: {
            health: "/api/v1/health",
            identity: "/api/v1/identity",
            governance: "/api/v1/governance",
            ngo: "/api/v1/ngo",
            customer: "/api/v1/customer",
            volunteers: "/api/v1/volunteers"
          }
        }
      });
    });

    const server = app.listen(ENV.PORT, () => {
      activePort = ENV.PORT;
      console.log(`🚀 Server is running on port ${activePort}`);
      console.log(`📝 Environment: ${ENV.NODE_ENV}`);
      console.log("ResQFood implementation is success");
      console.log(`Backend URL: http://localhost:${activePort}/api/v1/health`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${ENV.PORT} is already in use. Stop the old process and restart.`);
        process.exit(1);
      }

      console.error("✗ Server startup error:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("✗ Startup failed:", error.message);
    process.exit(1);
  }
};

bootstrap();
