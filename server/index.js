import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import aiRoutes from "./src/routes/ai.js";
import chatRoutes from "./src/routes/chat.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import { limiter } from "./src/middlewares/rateLimiter.js";
import { PORT } from "./src/utils/constants.js";

dotenv.config();

const app = express();

/* MIDDLEWARES */
app.use(cors());
app.use(express.json());

/* LOGGER */
const logger = (req, res, next) => {
  console.log(`METHOD: ${req.method} - URL:${req.url}`);
  next();
};

app.use(logger);

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/ai", limiter, aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
